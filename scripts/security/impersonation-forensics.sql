-- Read-only forensics for the forged-impersonation tenant bypass (fixed in
-- fix/impersonation-session). Before that fix, any signed-in user could set the
-- x-impersonated-org/-user/-session cookies and act inside another dealership:
-- answer its buyer questions, edit or delete its cars, spend its AI allowance.
--
-- Run against PRODUCTION, read-only, before deploying the fix:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/security/impersonation-forensics.sql
-- Every statement is a SELECT inside a READ ONLY transaction.
--
-- What these can and cannot show:
--   * Reads leave no row (inbox reads, getCarForEdit, plan/usage views), and
--     uploads land in Supabase storage, not here. Absence of rows below is not
--     proof that nothing happened.
--   * A membership removed since the event looks like a non-member: check each
--     hit against MEMBER_REMOVED entries before calling it abuse.
--   * Platform admins are excluded only where noted; before the fix an admin
--     could also act in any tenant without a session, which is by policy now
--     refused but was not abuse then.

BEGIN TRANSACTION READ ONLY;

-- 1. Buyer questions answered by someone who is neither a member of that
--    dealership nor a platform admin. Those answers are cited to buyers by the
--    public listing assistant — the most damaging write the hole allowed.
SELECT bq.id, bq."organizationId", o.slug, bq."carId", bq."answeredById", u.email AS answered_by_email,
       bq."answeredAt", left(bq.answer, 200) AS answer
FROM "BuyerQuestion" bq
JOIN "Organization" o ON o.id = bq."organizationId"
LEFT JOIN "User" u ON u.id = bq."answeredById"
WHERE bq."answeredById" IS NOT NULL
  AND COALESCE(u.role::text, '') <> 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" m
    WHERE m."userId" = bq."answeredById" AND m."organizationId" = bq."organizationId"
  )
ORDER BY bq."answeredAt" DESC;

-- 2. Activity entries in a dealership by a user who is not its member and not
--    a platform admin, grouped by action. Car changes and deletions here are
--    the second signal. Buyer-side actions (test-drive requests, reviews) are
--    expected from non-members — triage by action.
SELECT a.action, a."entityType", count(*) AS entries, min(a."createdAt") AS first_seen, max(a."createdAt") AS last_seen
FROM "AuditLog" a
LEFT JOIN "User" u ON u.id = a."userId"
WHERE a."organizationId" IS NOT NULL
  AND a."userId" IS NOT NULL
  AND COALESCE(u.role::text, '') <> 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" m
    WHERE m."userId" = a."userId" AND m."organizationId" = a."organizationId"
  )
GROUP BY a.action, a."entityType"
ORDER BY entries DESC;

-- 2b. The car rows behind 2, one per entry, for the actions that matter.
SELECT a."createdAt", a.action, a."organizationId", o.slug, a."entityId" AS car_id, a."userId", a."userEmail",
       a.metadata->>'ipAddress' AS ip, a.metadata->>'impersonationSessionId' AS session_id
FROM "AuditLog" a
LEFT JOIN "User" u ON u.id = a."userId"
LEFT JOIN "Organization" o ON o.id = a."organizationId"
WHERE a."entityType"::text = 'CAR'
  AND a."organizationId" IS NOT NULL
  AND a."userId" IS NOT NULL
  AND COALESCE(u.role::text, '') <> 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" m
    WHERE m."userId" = a."userId" AND m."organizationId" = a."organizationId"
  )
ORDER BY a."createdAt" DESC;

-- 3. Entries that name an impersonation session id with no session row — the
--    audit metadata trusted the forged x-impersonation-session value.
SELECT a."createdAt", a.action, a."organizationId", a."userId", a."impersonatedBy",
       a.metadata->>'impersonationSessionId' AS session_id
FROM "AuditLog" a
WHERE a.metadata ? 'impersonationSessionId'
  AND a.metadata->>'impersonationSessionId' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ImpersonationSession" s WHERE s.id = a.metadata->>'impersonationSessionId'
  )
ORDER BY a."createdAt" DESC;

-- 4. Dealer AI use billed to a dealership by a non-member, non-admin. Buyer
--    features (listingQA, chat, search) are excluded: buyers use those by design.
SELECT au."organizationId", o.slug, au."userId", us.email, au.feature, count(*) AS calls,
       min(au."createdAt") AS first_seen, max(au."createdAt") AS last_seen
FROM "AiUsage" au
JOIN "Organization" o ON o.id = au."organizationId"
LEFT JOIN "User" us ON us.id = au."userId"
WHERE au."userId" IS NOT NULL
  AND au.feature IN ('carListingFromImage', 'listingTranslation', 'listingQualityCoach')
  AND COALESCE(us.role::text, '') <> 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" m
    WHERE m."userId" = au."userId" AND m."organizationId" = au."organizationId"
  )
GROUP BY au."organizationId", o.slug, au."userId", us.email, au.feature
ORDER BY calls DESC;

-- 5. Context: every support session, so admin activity in 2–4 can be matched
--    to a real one.
SELECT s.id, s."startedAt", s."endedAt", s."superAdminId", s."targetUserId", s."targetOrganizationId", s.reason
FROM "ImpersonationSession" s
ORDER BY s."startedAt" DESC;

ROLLBACK;

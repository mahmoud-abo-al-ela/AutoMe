// Impersonation repository - Data access for super-admin support sessions.
export {
  getImpersonationSessions,
  countOpenSessionsStartedSince,
  createImpersonationSession,
  endImpersonationSession,
  findSessionWithParticipants,
  findSessionSuperAdminId,
  findSessionForAuthorization,
  type ImpersonationSessionFilters,
} from "./sessions";

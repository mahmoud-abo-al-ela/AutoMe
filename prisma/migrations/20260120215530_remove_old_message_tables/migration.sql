-- Drop old message and conversation tables that are no longer used
-- The app now uses StreamChat for all messaging functionality

-- Drop Message table first (has FK to Conversation)
DROP TABLE IF EXISTS "Message" CASCADE;

-- Drop Conversation table
DROP TABLE IF EXISTS "Conversation" CASCADE;

-- Remove message-related audit actions (optional - keeping for historical data)
-- If you want to clean up old audit logs, uncomment:
-- DELETE FROM "AuditLog" WHERE action IN ('CONVERSATION_CREATED', 'MESSAGE_SENT');

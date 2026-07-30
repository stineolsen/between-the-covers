// Shared permission checks for lists, reused by listController and commentController

const canViewList = (list, userId) => list.canView(userId);

const canEditList = (list, userId) => list.canEdit(userId);

module.exports = { canViewList, canEditList };

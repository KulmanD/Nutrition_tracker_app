let users = [
  {
    userId: 1,
    firstName: "Denis",
    lastName: "Kolman",
    createDate: "2026-05-01T10:00:00.000Z",
    updateDate: "2026-05-01T10:00:00.000Z",
    userRole: "admin"
  },
  {
    userId: 2,
    firstName: "Yael",
    lastName: "Dor-Rahli",
    createDate: "2026-05-01T10:10:00.000Z",
    updateDate: "2026-05-01T10:10:00.000Z",
    userRole: "user"
  },
  {
    userId: 3,
    firstName: "Amit",
    lastName: "Levi",
    createDate: "2026-05-02T12:30:00.000Z",
    updateDate: "2026-05-02T12:30:00.000Z",
    userRole: "manager"
  }
];

function getUsers() {
  return users;
}

function setUsers(newUsers) {
  users = newUsers;
}

function getNextUserId() {
  if (users.length === 0) {
    return 1;
  }

  return Math.max(...users.map((user) => user.userId)) + 1;
}

module.exports = {
  getUsers,
  setUsers,
  getNextUserId
};
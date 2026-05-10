let users = [ //our dummy users list
  {
    userId: 1, //their id
    firstName: "Denis", //first name
    lastName: "Kulman", //last name
    createDate: "2026-05-01T10:00:00.000Z", //when they joined
    updateDate: "2026-05-01T10:00:00.000Z", //last update
    userRole: "admin" //their role
  },
  {
    userId: 2,
    firstName: "Yael",
    lastName: "Dorahly",
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

function getUsers() { //function to get everyone
  return users; //give back the list
}

function setUsers(newUsers) { //function to update list
  users = newUsers; //save the new list
}

function getNextUserId() { //find the next id to use
  if (users.length === 0) { //if empty
    return 1; //start at 1
  }

  let highestUserId = Number(users[0].userId); //start with the first id

  for (let i = 1; i < users.length; i++) { //loop through everyone
    const currentUser = users[i]; //grab this user
    const currentUserId = Number(currentUser.userId); //get their id

    if (currentUserId > highestUserId) { //if it's bigger
      highestUserId = currentUserId; //save it as the new highest
    }
  }

  return highestUserId + 1; //add one for the next guy
}

module.exports = { //export our functions
  getUsers,
  setUsers,
  getNextUserId
};

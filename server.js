const express = require("express"); //bring in express

const usersRoutes = require("./routes/usersRoutes"); //grab user routes
const mealsRoutes = require("./routes/mealsRoutes"); //grab meal routes
const dashboardRoutes = require("./routes/dashboardRoutes"); //grab dashboard routes

const logger = require("./middleware/logger"); //pull in logger
const notFound = require("./middleware/notFound"); //pull in not found handler
const errorHandler = require("./middleware/errorHandler"); //pull in error handler

const app = express(); //start the app up
const port = 3000; //set our port to 3000

//log every request
app.use(logger); //use our logger middleware

//parse json bodies
app.use(express.json()); //let us read json data

//basic home route
app.get("/", (req, res) => { //main entry point
  res.json({ //send back some json
    success: true,
    data: { //the actual info
      message: "nutrition tracker backend api is running",
      baseUrl: "http://localhost:3000", //where we are
      endpoints: ["/users", "/meals", "/meals/analyze-image", "/dashboard/today"] //what we can do
    },
    error: null //no errors here
  });
});

//api routes
app.use("/users", usersRoutes); //hook up user endpoints
app.use("/meals", mealsRoutes); //hook up meal endpoints
app.use("/dashboard", dashboardRoutes); //hook up dashboard endpoints

//route not found handler
app.use(notFound); //catch missing pages

//unexpected error handler
app.use(errorHandler); //catch bad errors

app.listen(port, () => { //start listening
  console.log(`server running at http://localhost:${port}`); //tell us it's running
});

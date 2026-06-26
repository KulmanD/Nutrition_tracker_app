const express = require("express"); //bring in express
const http = require("http"); //bring in http server support

const usersRoutes = require("./routes/usersRoutes"); //grab user routes
const mealsRoutes = require("./routes/mealsRoutes"); //grab meal routes
const dashboardRoutes = require("./routes/dashboardRoutes"); //grab dashboard routes
const authRoutes = require("./routes/authRoutes"); //grab frontend auth routes
const apiUsersRoutes = require("./routes/apiUsersRoutes"); //grab current user route
const settingsRoutes = require("./routes/settingsRoutes"); //grab settings routes
const aiRoutes = require("./routes/aiRoutes"); //grab ai upload routes
const apiMealsRoutes = require("./routes/apiMealsRoutes"); //grab ai meal save routes

const cors = require("./middleware/cors"); //allow frontend browser requests
const logger = require("./middleware/logger"); //pull in logger
const notFound = require("./middleware/notFound"); //pull in not found handler
const errorHandler = require("./middleware/errorHandler"); //pull in error handler
const { initializeSocketServer } = require("./realtime/socketServer"); //wire realtime events

const app = express(); //start the app up
const port = Number(process.env.PORT || 3000); //use Render's assigned port when deployed
const server = http.createServer(app); //use one server for REST and Socket.IO

app.set("trust proxy", 1); //use the HTTPS protocol forwarded by Render

//log every request
app.use(cors); //allow the React app to call this API
app.use(logger); //use our logger middleware

//parse json bodies
app.use(express.json()); //let us read json data

//basic home route
app.get("/", (req, res) => { //main entry point
  res.json({ //send back some json
    success: true,
    data: { //the actual info
      message: "nutrition tracker backend api is running",
      baseUrl: `${req.protocol}://${req.get("host")}`, //where we are
      endpoints: ["/users", "/meals", "/meals/analyze-image", "/api/ai/analyze-image", "/api/meals/from-ai", "/dashboard/today"] //what we can do
    },
    error: null //no errors here
  });
});

//api routes
app.use("/api/auth", authRoutes); //hook up login/logout endpoints
app.use("/api/users", apiUsersRoutes); //hook up current user endpoint
app.use("/api/settings", settingsRoutes); //hook up settings endpoints
app.use("/api/ai", aiRoutes); //hook up ai image analysis endpoints
app.use("/api/meals", apiMealsRoutes); //hook up ai reviewed meal save endpoint
app.use("/users", usersRoutes); //hook up user endpoints
app.use("/meals", mealsRoutes); //hook up meal endpoints
app.use("/dashboard", dashboardRoutes); //hook up dashboard endpoints

//route not found handler
app.use(notFound); //catch missing pages

//unexpected error handler
app.use(errorHandler); //catch bad errors

initializeSocketServer(server); //start realtime socket support

server.listen(port, () => { //start listening
  console.log(`server running at http://localhost:${port}`); //tell us it's running
});

const express = require("express");

const usersRoutes = require("./routes/usersRoutes");
const mealsRoutes = require("./routes/mealsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");

const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const port = 3000;

// parse json bodies
app.use(express.json());

// log every request
app.use(logger);

// basic home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      message: "nutrition tracker backend api is running",
      baseUrl: "http://localhost:3000",
      endpoints: ["/users", "/meals", "/dashboard/today", "/ai/analyze-meal"]
    },
    error: null
  });
});

// api routes
app.use("/users", usersRoutes);
app.use("/meals", mealsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/ai", aiRoutes);

// route not found handler
app.use(notFound);

// unexpected error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
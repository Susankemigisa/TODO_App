import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("todos/:id/edit", "routes/todos.edit.tsx"),
  route("signup", "routes/signup.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
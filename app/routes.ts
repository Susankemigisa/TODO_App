import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("todos/:id/edit", "routes/todos.edit.tsx"),
] satisfies RouteConfig;
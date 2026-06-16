import { redirect } from "react-router";
import { getGoogleAuthUrl } from "../services/google.server";

export async function loader() {
  return redirect(getGoogleAuthUrl());
}
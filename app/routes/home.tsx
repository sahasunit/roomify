import NavBar from "components/NavBar";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="home">
      <NavBar />
      <h1 className="text-3xl text-indigo-500 font-extrabold">Home</h1>
    </div>
  );
}

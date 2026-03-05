import { useEffect } from "react";
import { SignedIn, SignedOut, SignIn, SignInButton, SignOutButton, UserButton } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import ProblemsPage from "./pages/ProblemsPage";
import { useUser } from "@clerk/clerk-react";
import { Toaster, toast } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";


function App() {

  useEffect(() => {
    console.log(import.meta.env.VITE_API_URL);

    fetch(`${import.meta.env.VITE_API_URL}`)
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.log("FETCH ERROR:", err));
  }, []);

  const {isSignedIn, isLoaded} = useUser();
  if(!isLoaded) return <div>Loading...</div>;

return (
  <>
  <Routes>

    <Route path="/" element={!isSignedIn ? <HomePage/> : <Navigate to={"/dashboard"} />} />
    <Route path="/dashboard" element={isSignedIn ? <DashboardPage/> : <Navigate to={"/"} />} />
     <Route path="/problems" element={isSignedIn ? <ProblemsPage/> : <Navigate to={"/"} />} />
   
  </Routes>
   <Toaster toastOptions={{duration: 3000}}/>
  </>
);

}

export default App;



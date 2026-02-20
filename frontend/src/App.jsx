import { useEffect } from "react";
import { SignedIn, SignedOut, SignIn, SignInButton, SignOutButton, UserButton } from "@clerk/clerk-react";


function App() {

  useEffect(() => {
    console.log(import.meta.env.VITE_API_URL);

    fetch(`${import.meta.env.VITE_API_URL}/books`)
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.log("FETCH ERROR:", err));
  }, []);

return (
  <div className="page">
    <h1>Welcome to InterviewBit</h1>

    <SignedOut>
      <SignInButton mode="modal" />
    </SignedOut>

    <SignedIn>
      <UserButton />
      <SignOutButton />
    </SignedIn>
  </div>
);

}

export default App;



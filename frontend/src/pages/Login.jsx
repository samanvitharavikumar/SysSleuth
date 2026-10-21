import React, { useState } from "react";



export default function Login() {

  const isAdminLogin = window.location.pathname === "/admin/login";



  const [role, setRole] = useState(isAdminLogin ? "admin" : null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");



  const selectRole = (selectedRole) => {

    setRole(selectedRole);

    setUsername("");

    setPassword("");

    setError("");

  };



 const goBack = () => {

  if (isAdminLogin) {

    window.location.href = "/my-tokens";

    return;

  }



  setRole(null);

  setUsername("");

  setPassword("");

  setError("");

};



  const handleLogin = (e) => {

    e.preventDefault();

    setError("");



    // =====================================================

    // USER LOGIN

    // =====================================================



    if (

      role === "user" &&

      username === "user" &&

      password === "user123"

    ) {

      sessionStorage.setItem("user_logged_in", "true");

  sessionStorage.setItem("logged_in_username", username);



  sessionStorage.removeItem("admin_logged_in");



      sessionStorage.removeItem(

        "admin_logged_in"

      );



      window.location.href = "/user";



      return;

    }



    // =====================================================

    // ADMIN LOGIN

    // =====================================================



    if (

      role === "admin" &&

      username === "admin" &&

      password === "admin123"

    ) {

      sessionStorage.setItem(

        "admin_logged_in",

        "true"

      );



      sessionStorage.removeItem(

        "user_logged_in"

      );



      window.location.href = "/admin";



      return;

    }



    setError("Invalid username or password.");

  };



  return (

    <div className="relative min-h-screen overflow-hidden bg-black text-white">



      {/* =====================================================

          NAVBAR

      ===================================================== */}



      <nav

        className="

          relative

          z-20

          h-[90px]

          border-b

          border-white/10

          bg-black/60

          backdrop-blur-xl

          flex

          items-center

          justify-between

          px-10

          md:px-16

        "

      >



        <div

          className="

            text-2xl

            md:text-3xl

            font-bold

            tracking-[0.25em]

            text-white/30

          "

        >

          SYSSLEUTH

        </div>







      </nav>





      {/* =====================================================

          MAIN

      ===================================================== */}



      <main className="relative min-h-[calc(100vh-90px)] overflow-hidden bg-black text-white">
        {/* Static ambient purple blobs and subtle grid */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Soft purple glow on the left */}
          <div className="absolute -left-40 top-[18%] h-[520px] w-[520px] rounded-full bg-purple-700/25 blur-[150px]" />

          {/* Fuchsia glow in the upper-right */}
          <div className="absolute -right-32 top-[4%] h-[460px] w-[460px] rounded-full bg-fuchsia-600/20 blur-[150px]" />

          {/* Subtle violet glow near the bottom */}
          <div className="absolute -bottom-48 right-[20%] h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[160px]" />

          {/* Static, very subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />
        </div>

        {/* =====================================================

            CONTENT

        ===================================================== */}



        <div

          className="

            relative

            z-10

            min-h-[calc(100vh-90px)]

            flex

            items-center

            justify-center

            px-6

            py-16

          "

        >



          <div

            className="

              w-full

              max-w-6xl

              grid

              md:grid-cols-2

              gap-16

              items-center

            "

          >



            {/* =================================================

                LEFT SIDE

            ================================================= */}



            <div>



              <p

                className="

                  text-sm

                  tracking-[0.4em]

                  uppercase

                  mb-8

                  text-purple-300

                "

              >

              </p>





              <h1

                className="

                  text-6xl

                  md:text-6xl

                  font-black

                  tracking-tight

                  leading-none

                "

              >



                SysSleuth



                <br />



                <span className="text-white/40">

                  A Failure adaptive telemtry system.

                </span>



              </h1>





              <p

                className="

                  mt-10

                  max-w-md

                  text-sm

                  leading-7

                  text-white/45

                "

              >



              </p>



            </div>





            {/* =================================================

                RIGHT SIDE

            ================================================= */}



            <div className="flex justify-center md:justify-end">



              <div className="w-full max-w-md">



                {/* =================================================

                    GLASS CARD

                ================================================= */}



                <div

                  className="

                    relative

                    overflow-hidden



                    border

                    border-white/10

                    bg-white/[0.06]

                    p-8

                    shadow-[0_25px_80px_rgba(0,0,0,0.7)]

                    backdrop-blur-2xl

                    md:p-10

                  "

                >



                  {/* Purple glowing top line */}



                  <div

                    className="

                      pointer-events-none

                      absolute

                      inset-x-10

                      top-0

                      h-px

                      bg-gradient-to-r

                      from-transparent

                      via-purple-400

                      to-transparent

                      shadow-[0_0_20px_rgba(168,85,247,0.8)]

                    "

                  />





                  {/* =================================================

                      STEP 1 — CHOOSE ROLE

                  ================================================= */}



                  {!role && (

                    <>



                      <p

                        className="

                          text-xs

                          tracking-[0.35em]

                          uppercase

                          text-purple-300/70

                          mb-4

                        "

                      >



                      </p>





                      <h2

                        className="

                          text-4xl

                          font-bold

                          tracking-tight

                          text-white/30

                        "

                      >

                        Choose your role.

                      </h2>





                      <p

                        className="

                          mt-3

                          text-sm

                          text-white/30

                          mb-10

                        "

                      >

                        Select how you want to access SysSleuth.

                      </p>





                      {/* =================================================

                          USER

                      ================================================= */}



                      <button

                        onClick={() => selectRole("user")}

                        className="

                          group

                          w-full



                          border

                          border-white/10

                          bg-white/[0.04]

                          p-6

                          mb-4

                          text-left

                          text-white/30



                          backdrop-blur-xl

                          transition-all

                          duration-300

                          hover:border-purple-400/40

                          hover:bg-purple-500/[0.10]

                          hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]

                        "

                      >



                        <div

                          className="

                            flex

                            items-center

                            justify-between

                          "

                        >



                          <div>



                            <p

                              className="



                                text-xs

                                tracking-[0.3em]

                                uppercase

                                mb-2

                                text-purple-300/60

                              "

                            >

                              Customer

                            </p>





                            <h3

                              className="

                                text-2xl

                                font-bold

                              "

                            >

                              USER

                            </h3>





                            <p

                              className="

                                text-sm

                                text-white/40

                                mt-2

                              "

                            >

                              Shop products and manage your orders.

                            </p>



                          </div>





                          <span

                            className="

                              text-2xl

                              text-purple-300

                              group-hover:translate-x-2

                              transition-transform

                            "

                          >

                            →

                          </span>



                        </div>



                      </button>





                      {/* =================================================

                          ADMIN

                      ================================================= */}



                      <button

                        onClick={() => selectRole("admin")}

                        className="

                          group

                          w-full



                          border

                          border-white/10

                          bg-white/[0.04]

                          p-6

                          text-left

                          text-white/30

                          backdrop-blur-xl

                          transition-all

                          duration-300

                          hover:border-purple-400/40

                          hover:bg-purple-500/[0.10]

                          hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]

                        "

                      >



                        <div

                          className="

                            flex

                            items-center

                            justify-between

                          "

                        >



                          <div>



                            <p

                              className="

                                text-xs

                                tracking-[0.3em]

                                uppercase

                                mb-2

                                text-purple-300/60

                              "

                            >

                              Management

                            </p>





                            <h3

                              className="

                                text-2xl

                                font-bold

                              "

                            >

                              ADMIN

                            </h3>





                            <p

                              className="

                                text-sm

                                text-white/40

                                mt-2

                              "

                            >

                              Monitor incidents and analyze system failures.

                            </p>



                          </div>





                          <span

                            className="

                              text-2xl

                              text-purple-300

                              group-hover:translate-x-2

                              transition-transform

                            "

                          >

                            →

                          </span>



                        </div>



                      </button>



                    </>

                  )}





                  {/* =================================================

                      STEP 2 — LOGIN

                  ================================================= */}



                  {role && (

                    <>



                      {/* BACK */}



                      <button

                        onClick={goBack}

                        className="

                          text-xs

                          uppercase

                          tracking-[0.2em]

                          text-white/40

                          hover:text-purple-300

                          mb-8

                          transition

                        "

                      >

                        ← Back

                      </button>





                      {/* HEADING */}



                      <p

                        className="

                          text-xs

                          tracking-[0.35em]

                          uppercase

                          text-purple-300/70

                          mb-4

                        "

                      >

                        {role === "user"

                          ? "Customer Access"

                          : "Management Access"}

                      </p>





                      <h2

                        className="

                          text-4xl

                          font-bold

                          tracking-tight

                        "

                      >

                        Welcome back.

                      </h2>





                      <p

                        className="

                          mt-3

                          text-sm

                          text-white/40

                          mb-10

                        "

                      >

                        Sign in as{" "}

                        <span className="font-semibold text-white">

                          {role.toUpperCase()}

                        </span>

                      </p>





                      {/* LOGIN FORM */}



                      <form

                        onSubmit={handleLogin}

                        className="space-y-7"

                      >



                        {/* USERNAME */}



                        <div>



                          <label

                            className="

                              block

                              text-xs

                              uppercase

                              tracking-[0.2em]

                              text-white/50

                              mb-2

                            "

                          >

                            Username

                          </label>





                          <input

                            type="text"

                            value={username}

                            onChange={(e) =>

                              setUsername(e.target.value)

                            }

                            placeholder="Enter username"

                            className="

                              w-full

                              border-b

                              border-white/20

                              bg-transparent

                              px-1

                              py-3

                              text-sm

                              text-white

                              outline-none

                              placeholder:text-white/20

                              focus:border-purple-400

                              transition

                            "

                            required

                          />



                        </div>





                        {/* PASSWORD */}



                        <div>



                          <label

                            className="

                              block

                              text-xs

                              uppercase

                              tracking-[0.2em]

                              text-white/50

                              mb-2

                            "

                          >

                            Password

                          </label>





                          <input

                            type="password"

                            value={password}

                            onChange={(e) =>

                              setPassword(e.target.value)

                            }

                            placeholder="Enter password"

                            className="

                              w-full

                              border-b

                              border-white/20

                              bg-transparent

                              px-1

                              py-3

                              text-sm

                              text-white

                              outline-none

                              placeholder:text-white/20

                              focus:border-purple-400

                              transition

                            "

                            required

                          />



                        </div>





                        {/* ERROR */}



                        {error && (

                          <div

                            className="

                              rounded-xl

                              border

                              border-red-500/20

                              bg-red-500/10

                              px-4

                              py-3

                              text-sm

                              text-red-300

                            "

                          >

                            {error}

                          </div>

                        )}





                        {/* SIGN IN */}



                        <button

                          type="submit"

                          className="

                            w-full



                            border

                            border-purple-400/40

                            bg-purple-600/20

                            py-4

                            text-xs

                            uppercase

                            tracking-[0.3em]

                            text-white

                            backdrop-blur-md

                            transition-all

                            duration-300

                            hover:border-purple-300/70

                            hover:bg-purple-500/30

                            hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]

                          "

                        >

                          Sign In

                        </button>



                      </form>













                    </>

                  )}









                </div>



              </div>



            </div>



          </div>



        </div>



      </main>



    </div>

  );

}
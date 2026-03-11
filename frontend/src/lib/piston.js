// // This file now calls the backend instead of Piston directly

// // NEW
// const BACKEND_API = "http://localhost:5000/api/code";

// const LANGUAGE_VERSIONS = {
//   javascript: { language: "javascript", version: "18.15.0" },
//   python: { language: "python", version: "3.10.0" },
//   java: { language: "java", version: "15.0.2" },
// };

// /**
//  * @param {string} language - programming language
//  * @param {string} code - source code to execute
//  * @returns {Promise<{success:boolean, output?:string, error?:string}>}
//  */
// export async function executeCode(language, code) {
//   try {
//     const languageConfig = LANGUAGE_VERSIONS[language];

//     if (!languageConfig) {
//       return {
//         success: false,
//         error: `Unsupported language: ${language}`,
//       };
//     }

//     const response = await fetch(`${BACKEND_API}/execute`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         language: languageConfig.language,
//         version: languageConfig.version,
//         code: code,
//       }),
//     });

//     if (!response.ok) {
//       return {
//         success: false,
//         error: `HTTP error! status: ${response.status}`,
//       };
//     }

//     const data = await response.json();

//     const output = data.run?.output || "";
//     const stderr = data.run?.stderr || "";

//     console.log("Piston API response:", data);

//     if (stderr) {
//       return {
//         success: false,
//         output: output,
//         error: stderr,
//       };
//     }

//     return {
//       success: true,
//       output: output || "No output",
//     };

//   } catch (error) {
//     return {
//       success: false,
//       error: `Failed to execute code: ${error.message}`,
//     };
//   }
// }

const BACKEND_API = import.meta.env.VITE_API_URL + "/api/code";
export async function executeCode(language, code) {
  try {
    const response = await fetch(`${BACKEND_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    const output = data.stdout || "";
    const error = data.stderr || data.compile_output || "";

    if (error) {
      return { success: false, output, error: String(error) };
    }

    return { success: true, output: output || "No output" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
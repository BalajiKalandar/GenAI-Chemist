import React, { useEffect, useState } from "react";

const App: React.FC = () => {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState("");
  const [marketTrends, setMarketTrends] = useState("");
  const [shouldGenerateTrends, setShouldGenerateTrends] = useState(false);

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:3002/generate-brand-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandName, industry, audience }),
    });

    const data = await res.json();
    setResult(data.idea || "No idea generated.");
    setShouldGenerateTrends(true); // Trigger Hugging Face generation next
  };
  //***************************************************************************************************************************************** */
  useEffect(() => {
    if (!shouldGenerateTrends || !result) return;

    const getMarketTrends = async () => {
      try {
        const res = await fetch("http://localhost:3002/get-market-trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marketPrompt: `Summarize recent market trends in the ${industry} industry, considering this brand idea: ${result}`,
          }),
        });

        const data = await res.json();
        setMarketTrends(data.summary || "No market trends found.");
      } catch (err) {
        console.error("Hugging Face error:", err);
        setMarketTrends("Error fetching market trends.");
      } finally {
        setShouldGenerateTrends(false); // Prevent reruns
      }
    };

    getMarketTrends();
  }, [shouldGenerateTrends, result, industry]);
  //***************************************************************************************************************************************** */

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h2>🔮 AI Brand Idea Generator</h2>
      <input
        placeholder="Brand Name"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
        style={{
          display: "block",
          marginBottom: 10,
          width: "100%",
          padding: 10,
        }}
      />
      <input
        placeholder="Industry"
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        style={{
          display: "block",
          marginBottom: 10,
          width: "100%",
          padding: 10,
        }}
      />
      <input
        placeholder="Target Audience"
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        style={{
          display: "block",
          marginBottom: 10,
          width: "100%",
          padding: 10,
        }}
      />
      <button onClick={handleSubmit} style={{ padding: 10, width: "100%" }}>
        Generate Brand Idea
      </button>

      <h4 style={{ marginTop: 30 }}>✨ Brand Idea</h4>
      <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>

      {marketTrends && (
        <>
          <h4 style={{ marginTop: 30 }}>📊 Market Trends</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>{marketTrends}</pre>
        </>
      )}
    </div>
  );
};

export default App;

// import React, { useEffect, useState } from "react";

// const App: React.FC = () => {
//   const [brandName, setBrandName] = useState("");
//   const [industry, setIndustry] = useState("");
//   const [audience, setAudience] = useState("");
//   const [result, setResult] = useState("");

//   const handleSubmit = async () => {
//     const res = await fetch("http://localhost:3001/generate-brand-idea", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ brandName, industry, audience }),
//     });

//     const data = await res.json();
//     setResult(data.idea || "No idea generated.");
//     console.log("prompt " + result);
//   };

//   useEffect(() => {
//     const getMarketTrends = async (text: string) => {
//       const res = await fetch("http://localhost:3001/get-market-trends", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ result: text }),
//       });

//       const data = await res.json();
//       console.log("Market Trends Summary:", data.summary);
//     };
//   }, [result]);

//   return (
//     <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
//       <h2>🔮 AI Brand Idea Generator</h2>
//       <input
//         placeholder="Brand Name"
//         value={brandName}
//         onChange={(e) => setBrandName(e.target.value)}
//         style={{
//           display: "block",
//           marginBottom: 10,
//           width: "100%",
//           padding: 10,
//         }}
//       />
//       <input
//         placeholder="Industry"
//         value={industry}
//         onChange={(e) => setIndustry(e.target.value)}
//         style={{
//           display: "block",
//           marginBottom: 10,
//           width: "100%",
//           padding: 10,
//         }}
//       />
//       <input
//         placeholder="Target Audience"
//         value={audience}
//         onChange={(e) => setAudience(e.target.value)}
//         style={{
//           display: "block",
//           marginBottom: 10,
//           width: "100%",
//           padding: 10,
//         }}
//       />
//       <button onClick={handleSubmit} style={{ padding: 10, width: "100%" }}>
//         Generate Brand Idea
//       </button>
//       <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{result}</pre>
//     </div>
//   );
// };

// export default App;

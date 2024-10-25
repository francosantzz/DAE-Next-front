"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [catsData, setCatsData] = useState(null); // Estado para almacenar los datos de los gatos
  const [loadingCats, setLoadingCats] = useState(false); // Estado para manejar el estado de carga

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  console.log(session);
  console.log(process.env.NEXT_PUBLIC_BACKEND_URL);

  const getCats = async () => {
    setLoadingCats(true); // Inicia el estado de carga
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
      });
      const data = await res.json();
      setCatsData(data); // Actualiza el estado con la data de los gatos
      console.log(data);
    } catch (error) {
      console.error("Error fetching cats:", error);
    } finally {
      setLoadingCats(false); // Termina el estado de carga
    }
  };

  return (
    <div>
        <pre>
        <code>{JSON.stringify(session, null, 2)}</code>
        </pre>
      <h1>Dashboard</h1>
      <button onClick={getCats} className="btn btn-primary">
        {loadingCats ? "Loading..." : "Get Cats"}
      </button>
      {/* Mostrar datos de gatos si existen */}
      {catsData && (
        <div className="mt-4">
          <h2>Cats Data:</h2>
          <pre>
            <code>{JSON.stringify(catsData, null, 2)}</code>
          </pre>
        </div>
      )}
      
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState, useContext } from "react";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AuthContext from "../config/context/auth-context";
import AxiosClient from "../config/http-gateway/http-client";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Informe = () => {
    const { state } = useContext(AuthContext);
    const [grupoId, setGrupoId] = useState(localStorage.getItem("grupoSeleccionado") || "");
    const [grupoNombre, setGrupoNombre] = useState(localStorage.getItem("grupoSeleccionadoNombre") || "");
    const [gruposUsuario, setGruposUsuario] = useState([]);
    const [reporte, setReporte] = useState(null);
    const [gastosFiltrados, setGastosFiltrados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mes, setMes] = useState("");
    const [anio, setAnio] = useState("");

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const aniosDisponibles = Array.from({ length: 6 }, (_, i) => 2025 + i);


    const obtenerUltimoDiaMes = (anio, mes) => {
        return new Date(anio, mes, 0).getDate();
    };

    const obtenerGrupos = async () => {
        try {
            const res = await AxiosClient.get("/grupos/mis-grupos");
            const grupos = res.data?.grupos || [];
            console.log("Grupos obtenidos:", grupos);
            setGruposUsuario(grupos);
        } catch (err) {
            setError("Error al obtener grupos del usuario");
        }
    };

    const seleccionarGrupo = (e) => {
        const idGrupo = e.target.value;
        const grupo = gruposUsuario.find((g) => (g.idGrupo?.toString() === idGrupo));
        if (grupo) {
            setGrupoId(idGrupo);
            setGrupoNombre(grupo.nombre);
            localStorage.setItem("grupoSeleccionado", idGrupo);
            localStorage.setItem("grupoSeleccionadoNombre", grupo.nombre);
        }
    };

    useEffect(() => {
        obtenerGrupos();
    }, []);

    useEffect(() => {
        if (gruposUsuario.length === 0) {
            setGrupoId("");
            setGrupoNombre("");
            localStorage.removeItem("grupoSeleccionado");
            localStorage.removeItem("grupoSeleccionadoNombre");
        } else if (grupoId) {
            const existe = gruposUsuario.some(g => g.idGrupo?.toString() === grupoId);
            if (!existe) {
                setGrupoId("");
                setGrupoNombre("");
                localStorage.removeItem("grupoSeleccionado");
                localStorage.removeItem("grupoSeleccionadoNombre");
            }
        }
    }, [gruposUsuario, grupoId]);

    const consultarReporte = async () => {
        if (!grupoId) {
            setError("Selecciona un grupo");
            return;
        }

        if (mes === "ultimos3") {
            // Consultar últimos 3 meses
        } else if (!mes) {
            return setError("Selecciona un mes");
        } else if (!anio) {
            return setError("Selecciona un año");
        }

        let url = `/gastos/grupo/${grupoId}/reporte`;

        if (mes === "ultimos3") {
            // no agregar query, el backend ya lo calcula
        } else {
            const mesNum = parseInt(mes);
            const inicio = `${anio}-${String(mesNum).padStart(2, "0")}-01`;
            const fin = `${anio}-${String(mesNum).padStart(2, "0")}-${obtenerUltimoDiaMes(anio, mesNum)}`;
            url += `?inicio=${inicio}&fin=${fin}`;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await AxiosClient.get(url);
            const gastosCompletos = res.data.gastos.filter(gasto => gasto.pagadoPorTodos);
            setReporte({ ...res.data, gastos: gastosCompletos });
            setGastosFiltrados(gastosCompletos);
        } catch (err) {
            setError("Error al cargar reporte del grupo");
        } finally {
            setLoading(false);
        }
    };


    const exportarPDF = async () => {
        const confirmar = await Swal.fire({
            title: "¿Deseas descargar el PDF?",
            text: `Se descargará el Informe del grupo "${grupoNombre}"`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Aceptar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            customClass: {
                confirmButton: "bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700",
                cancelButton: "bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300",
                actions: "flex justify-end gap-3 pt-2"
            },
            buttonsStyling: false,
        });

        if (!confirmar.isConfirmed) return;

        const input = document.getElementById("reporte-content");
        if (!input) return;

        const pdf = new jsPDF("p", "mm", "a4");
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const headerHeight = 20;
        const contentTopOffset = headerHeight + 12;
        const usableHeight = pageHeight - contentTopOffset - margin;

        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = usableWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        let y = 0;

        pdf.setFillColor(242, 235, 255);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");
        pdf.setFontSize(18);
        pdf.setTextColor(87, 36, 122);
        pdf.text(`Informe de Estadísticas de Gastos de ${grupoNombre}`, pageWidth / 2, 12, { align: "center" });

        const fecha = new Date().toLocaleString("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
        });
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Generado: ${fecha}`, margin, headerHeight + 6);

        const canvasHeight = canvas.height;
        const canvasWidth = canvas.width;
        const pageCanvasHeight = (usableHeight * canvasWidth) / imgWidth;

        while (y < canvasHeight) {
            const pageCanvas = document.createElement("canvas");
            pageCanvas.width = canvasWidth;
            pageCanvas.height = Math.min(pageCanvasHeight, canvasHeight - y);

            const ctx = pageCanvas.getContext("2d");
            ctx.drawImage(canvas, 0, y, canvasWidth, pageCanvas.height, 0, 0, canvasWidth, pageCanvas.height);

            const imgChunk = pageCanvas.toDataURL("image/png");

            if (y > 0) pdf.addPage();

            const yOffset = y === 0 ? contentTopOffset : margin;

            pdf.addImage(imgChunk, "PNG", margin, yOffset, imgWidth, (pageCanvas.height * imgWidth) / canvasWidth);

            y += pageCanvasHeight;
        }

        pdf.save(`${grupoNombre}.pdf`);
    };



    const exportarExcel = async () => {
        if (!reporte?.gastos) return;

        const confirmar = await Swal.fire({
            title: "¿Deseas descargar el Excel?",
            text: `Se descargará el Informe del grupo "${grupoNombre}"`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Aceptar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            customClass: {
                confirmButton: "bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700",
                cancelButton: "bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300",
                actions: "flex justify-end gap-3 pt-2"
            },
            buttonsStyling: false,
        });

        if (!confirmar.isConfirmed) return;

        const data = [];
        reporte.gastos.forEach(g => {
            g.miembros.forEach(m => {
                data.push({
                    Gasto: g.descripcion,
                    Usuario: m.nombre || m.correo,
                    "Pagado": m.pagado ? "si" : "debe",
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${grupoNombre}.xlsx`);
    };


    const coloresDinamicos = [
        "#7c3aed", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6",
        "#e879f9", "#f472b6", "#facc15", "#4ade80"
    ];

    const Grafica = ({ gastos }) => {
        const resumenPorUsuario = {};
        gastos.forEach(g => {
            g.miembros.forEach(m => {
                const key = m.nombre || m.correo;
                resumenPorUsuario[key] = (resumenPorUsuario[key] || 0) + Number(m.montoAsignado);
            });
        });

        const labels = Object.keys(resumenPorUsuario);
        const datos = Object.values(resumenPorUsuario);

        const chartData = {
            labels,
            datasets: [{
                label: "Total Asignado",
                data: datos,
                backgroundColor: labels.map((_, i) => coloresDinamicos[i % coloresDinamicos.length])
            }]
        };

        const options = {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: "Total Asignado por Usuario" },
            },
        };

        return <Bar data={chartData} options={options} />;
    };

    const Tabla = ({ gastos }) => (
        <div className="space-y-6">
            {gastos.map((g, idx) => (
                <div key={idx} className="rounded-xl shadow border border-purple-100 bg-white/90 overflow-hidden">
                    <div className="bg-purple-100 px-4 py-2 text-purple-900 font-semibold text-lg relative flex items-center">
                        <div className="mx-auto">
                            {g.descripcion} - ${g.montoTotal.toFixed(2)}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-600 text-right space-y-1">
                            <div><strong>Creado el:</strong> {new Date(g.fechaCreacion).toLocaleDateString()}</div>
                        </div>
                    </div>


                    <table className="w-full text-sm text-left text-gray-700 mt-2">
                        <thead className="bg-purple-50 text-purple-900">
                            <tr>
                                <th className="px-4 py-2">Miembro</th>
                                <th className="px-4 py-2">Pagado:</th>
                            </tr>
                        </thead>
                        <tbody>
                            {g.miembros.map((m, i) => (
                                <tr key={i} className="even:bg-purple-50">
                                    <td className="px-4 py-2">{m.nombre || m.correo}</td>
                                    <td className="px-4 py-2">{m.pagado ? "✅" : "❌"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );

    const deshabilitarAnio = mes === "ultimos3";

    return (
        <div className="w-full max-w-6xl mx-auto py-10 px-4">
            <div className="mb-8 flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-purple-400 rounded-xl shadow-lg px-6 py-4 flex-1">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">Informe de Gastos</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <select
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg px-4 py-2 w-full bg-purple-50 text-purple-900 font-medium shadow-sm"
                    onChange={seleccionarGrupo}
                    value={grupoId || ""}
                >
                    <option value="">-- Selecciona un grupo --</option>
                    {(gruposUsuario || []).map((g) => (
                        <option key={g.idGrupo} value={g.idGrupo}>{g.nombre}</option>
                    ))}
                </select>

                <select
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg px-4 py-2 w-full bg-purple-50 text-purple-900 font-medium shadow-sm"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                >
                    <option value="">Mes</option>
                    <option value="ultimos3">Últimos 3 meses</option>
                    {meses.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>

                <select
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition rounded-lg px-4 py-2 w-full bg-purple-50 text-purple-900 font-medium shadow-sm"
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    disabled={deshabilitarAnio}
                >
                    <option value="">Año</option>
                    {aniosDisponibles.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>

                <button onClick={consultarReporte} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                    Consultar Informe
                </button>
            </div>

            {loading ? (
                <p className="text-purple-600">Cargando...</p>
            ) : error ? (
                <p className="text-red-600">{error}</p>
            ) : reporte?.gastos?.length ? (
                <>
                    <div id="reporte-content" className="space-y-6">
                        <div className="bg-white/90 shadow-lg rounded-2xl p-6 mb-8 border border-purple-100">
                            <Grafica gastos={reporte.gastos} />
                        </div>
                        <div className="bg-white/90 shadow-lg rounded-2xl p-6 border border-purple-100">
                            <Tabla gastos={reporte.gastos} />
                        </div>
                    </div>

                    <div className="flex justify-end mt-6 gap-4">
                        <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow">
                            Exportar a Excel
                        </button>
                        <button onClick={exportarPDF} className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow">
                            Exportar a PDF
                        </button>
                    </div>
                </>
            ) : grupoId ? (
                <div className="flex justify-center items-center h-40">
                    <span className="text-lg text-gray-500 font-medium">No hay datos en este mes.</span>
                </div>
            ) : (
                <div className="flex justify-center items-center h-40">
                    <span className="text-lg text-gray-500 font-medium">Selecciona un grupo, mes y año.</span>
                </div>
            )}
        </div>
    );
};

export default Informe;

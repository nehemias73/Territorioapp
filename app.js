// ==========================================
// CONFIGURACIÓN
// ==========================================
// Pega aquí la URL que te dará Google Apps Script al implementar
const API_URL = "https://script.google.com/macros/s/AKfycbxuGEb0ARTFO3MOZmJfIwh4z2Zi40Y26MZKZcaOisI-UbPyDqSceeXv7zeC5EG3BIfi/exec"; 

// DATOS DE PRUEBA
const MOCK_DATA = [
    {id: 1, nombre: "Territorio 101 - Comercial", estado: "Disponible", publicador: "", fechaInicio: "", fechaFin: "", notas: "", imagen: "", mapaUrl: "https://maps.google.com"},
    {id: 2, nombre: "Territorio 102 - Residencial", estado: "Incompleto", publicador: "Familia Gómez", fechaInicio: "2023-10-01", fechaFin: "", notas: "Falta la manzana de la esquina", imagen: "", mapaUrl: ""},
    {id: 3, nombre: "Territorio 103 - Rural", estado: "Completo", publicador: "Hno. López", fechaInicio: "2023-09-01", fechaFin: "2023-09-20", notas: "", imagen: "", mapaUrl: ""}
];

// ==========================================
// LÓGICA
// ==========================================

const grid = document.getElementById('grid');
const modalOverlay = document.getElementById('modalOverlay');
const form = document.getElementById('territoryForm');
let currentTerritories = [];

async function loadData() {
    if (!API_URL) {
        console.warn("No hay API_URL definida. Usando datos de prueba.");
        currentTerritories = MOCK_DATA;
        renderGrid(currentTerritories);
        return;
    }

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        currentTerritories = data;
        renderGrid(data);
    } catch (error) {
        console.error("Error cargando datos:", error);
        grid.innerHTML = '<p style="text-align:center; color:red;">Error al conectar con la hoja de cálculo. Verifica la URL.</p>';
    }
}

function filterTerritories() {
    const searchElement = document.getElementById('searchInput');
    const statusElement = document.getElementById('statusFilter');

    const searchTerm = searchElement ? searchElement.value.toLowerCase().trim() : "";
    const statusFilter = statusElement ? statusElement.value : ""; 

    const filtered = currentTerritories.filter(t => {
        const nombre = (t.nombre || "").toString().toLowerCase();
        const id = (t.id || "").toString().toLowerCase();
        const publicador = (t.publicador || "").toString().toLowerCase();
        
        const textMatches = nombre.includes(searchTerm) || 
                            id.includes(searchTerm) || 
                            publicador.includes(searchTerm);
        
        const estadoItem = (t.estado || "").toString().toLowerCase().trim();
        const estadoBusqueda = statusFilter.toLowerCase().trim();

        const statusMatches = estadoBusqueda === "" || estadoItem === estadoBusqueda;

        return textMatches && statusMatches;
    });
    
    renderGrid(filtered);
}

function renderGrid(data) {
    grid.innerHTML = '';
    
    if(data.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#666; grid-column: 1/-1;">No se encontraron territorios con esos filtros.</p>';
        return;
    }

    data.forEach(t => {
        let statusClass = t.estado.toLowerCase().replace(' ', '');
        if(statusClass.includes('asignado')) statusClass = 'asignado';
        else if(statusClass.includes('completo')) statusClass = 'completado';
        else statusClass = 'disponible';
        
        const card = document.createElement('div');
        card.className = `card ${statusClass}`;
        
        // Al hacer clic en la tarjeta, abrimos el modal
        card.onclick = () => openModal(t.id);

        // Ya no generamos el botón de mapa aquí para mantener la lista limpia
        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${t.nombre}</span>
                <span class="badge ${statusClass}">${t.estado}</span>
            </div>
            <div class="card-body">
                ${t.publicador ? `<div class="info-row">👤 ${t.publicador}</div>` : '<div class="info-row" style="color:#aaa;">Sin asignar</div>'}
                ${t.fechaInicio ? `<div class="info-row">📅 Inicio: ${formatDate(t.fechaInicio)}</div>` : ''}
                ${t.estado === 'Completado' && t.fechaFin ? `<div class="info-row">🏁 Fin: ${formatDate(t.fechaFin)}</div>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

function openModal(id) {
    const t = currentTerritories.find(item => item.id == id);
    if (!t) return;

    document.getElementById('territoryId').value = t.id;
    document.getElementById('modalTitle').innerText = t.nombre;
    document.getElementById('status').value = t.estado;
    document.getElementById('publisher').value = t.publicador;
    document.getElementById('notes').value = t.notas || ""; 
    // ELIMINADO: document.getElementById('mapaUrl').value = t.mapaUrl || "";
    
    document.getElementById('dateStart').value = t.fechaInicio ? new Date(t.fechaInicio).toISOString().split('T')[0] : '';
    document.getElementById('dateEnd').value = t.fechaFin ? new Date(t.fechaFin).toISOString().split('T')[0] : '';

    const mediaPreview = document.getElementById('mediaPreview');
    if (t.imagen && t.imagen.startsWith('http')) {
        mediaPreview.innerHTML = `<img src="${t.imagen}" alt="Mapa Imagen" onclick="openLightbox('${t.imagen}')" style="cursor: pointer; transition: opacity 0.2s;" title="Toca para ampliar">`;
    } else {
        mediaPreview.innerHTML = `<span>🗺️ Sin imagen de mapa</span>`;
    }

    const mapLinkContainer = document.getElementById('mapLinkContainer');
    if (t.mapaUrl && t.mapaUrl.startsWith('http')) {
        // El botón sigue apareciendo para IR al mapa, pero no se puede editar la URL
        mapLinkContainer.innerHTML = `<a href="${t.mapaUrl}" target="_blank" class="btn btn-map" style="text-decoration:none; display:inline-block;">📍 Ver ubicación en Google Maps</a>`;
    } else {
        mapLinkContainer.innerHTML = '';
    }

    toggleFields();
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

function openLightbox(url) {
    const lightbox = document.getElementById('lightboxOverlay');
    const img = document.getElementById('lightboxImage');
    if(lightbox && img) {
        img.src = url;
        lightbox.classList.add('active');
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightboxOverlay');
    if(lightbox) lightbox.classList.remove('active');
}

function toggleFields() {
    // Espacio reservado para lógica futura
}

// --- FUNCIÓN S-13 ---
function printS13() {
    const currentYear = new Date().getFullYear();
    const serviceYear = `${currentYear}/${currentYear + 1}`;

    const sortedData = [...currentTerritories].sort((a, b) => {
        return parseInt(a.id) - parseInt(b.id) || a.id.localeCompare(b.id);
    });

    let rows = '';
    
    sortedData.forEach(t => {
        let historial = t.historial || [];
        
        if (historial.length === 0 && t.publicador) {
             historial = [{
                 publicador: t.publicador,
                 fechaInicio: t.fechaInicio,
                 fechaFin: t.fechaFin
             }];
        }

        const assignmentsToShow = historial.slice(-4); 

        let cellsHTML = '';
        for (let i = 0; i < 4; i++) {
            const assignment = assignmentsToShow[i];
            
            if (assignment) {
                const inicio = assignment.fechaInicio ? formatDateShort(assignment.fechaInicio) : '&nbsp;';
                const fin = assignment.fechaFin ? formatDateShort(assignment.fechaFin) : '&nbsp;';
                const pub = assignment.publicador || '&nbsp;';
                
                cellsHTML += `
                    <td class="col-assign">
                        <div class="cell-name">${pub}</div>
                        <div class="cell-dates">
                            <span class="date-box" style="border-right: 1px solid #000;">${inicio}</span>
                            <span class="date-box">${fin}</span>
                        </div>
                    </td>
                `;
            } else {
                cellsHTML += `
                    <td class="col-assign">
                        <div class="cell-name">&nbsp;</div>
                        <div class="cell-dates">
                            <span class="date-box" style="border-right: 1px solid #000;">&nbsp;</span>
                            <span class="date-box">&nbsp;</span>
                        </div>
                    </td>
                `;
            }
        }

        rows += `
            <tr>
                <td style="text-align: center; font-weight: bold; vertical-align: middle;">${t.id}</td>
                <td></td> 
                ${cellsHTML}
            </tr>
        `;
    });

    const printContent = `
        <html>
        <head>
            <title>S-13 Registro de Territorio</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
                
                body { font-family: 'Noto Sans', 'Arial', sans-serif; padding: 0; margin: 0; color: #000; font-size: 10px; }
                .header-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px; padding-bottom: 5px; }
                .main-title { font-weight: bold; font-size: 14px; text-transform: uppercase; text-align: center; flex-grow: 1; }
                .service-year { font-size: 11px; position: absolute; left: 0; top: 0; }
                table { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; }
                th, td { border: 1px solid #000; padding: 0; vertical-align: middle; }
                th { text-align: center; background-color: #fff; font-weight: bold; font-size: 8px; padding: 2px; }
                .th-num { width: 5%; }
                .th-last { width: 10%; }
                .col-assign { width: 21.25%; }
                .cell-name { border-bottom: 1px solid #000; min-height: 16px; padding: 2px 4px; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .cell-dates { display: flex; height: 14px; }
                .date-box { flex: 1; text-align: center; font-size: 9px; line-height: 14px; }
                .footer { margin-top: 5px; display: flex; justify-content: space-between; font-size: 8px; }
                @media print { @page { size: portrait; margin: 1cm; } body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            <div style="position: relative; height: 30px; margin-bottom: 10px;">
                <div class="service-year">Año de servicio: ${serviceYear}</div>
                <div class="main-title">REGISTRO DE ASIGNACIÓN DE TERRITORIO</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th rowspan="2" class="th-num">Núm.<br>de terr.</th>
                        <th rowspan="2" class="th-last">Última fecha<br>en que se<br>completó*</th>
                        <th class="col-assign">Asignado a</th>
                        <th class="col-assign">Asignado a</th>
                        <th class="col-assign">Asignado a</th>
                        <th class="col-assign">Asignado a</th>
                    </tr>
                    <tr>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;"><span>F. Asignó</span><span>F. Completó</span></div>
                        </th>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;"><span>F. Asignó</span><span>F. Completó</span></div>
                        </th>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;"><span>F. Asignó</span><span>F. Completó</span></div>
                        </th>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;"><span>F. Asignó</span><span>F. Completó</span></div>
                        </th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="footer">
                <div>*Cuando comience una nueva página, anote en esta columna la última fecha en que los territorios se completaron.</div>
                <div style="font-weight: bold;">S-13-S</div>
            </div>
        </body>
        </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close(); 
    
    setTimeout(() => {
        win.focus();
        win.print();
    }, 500);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerText;
    
    saveBtn.disabled = true;
    saveBtn.innerText = "Guardando...";

    const formData = {
        id: document.getElementById('territoryId').value,
        estado: document.getElementById('status').value,
        publicador: document.getElementById('publisher').value,
        fechaInicio: document.getElementById('dateStart').value,
        fechaFin: document.getElementById('dateEnd').value,
        notas: document.getElementById('notes').value,
        // ELIMINADO: mapaUrl: document.getElementById('mapaUrl').value
    };

    if (!API_URL) {
        alert("Modo Demo: Guardado localmente.");
        const index = MOCK_DATA.findIndex(x => x.id == formData.id);
        if(index !== -1) {
            MOCK_DATA[index] = { ...MOCK_DATA[index], ...formData };
            if(!MOCK_DATA[index].historial) MOCK_DATA[index].historial = [];
            
            // Simulación Historial
            if(formData.estado === 'Completado') {
                 MOCK_DATA[index].historial.push({
                    publicador: formData.publicador,
                    fechaInicio: formData.fechaInicio,
                    fechaFin: formData.fechaFin,
                    estado: 'Completado'
                });
                // Reseteo visual inmediato para la demo
                MOCK_DATA[index].estado = 'Disponible';
                MOCK_DATA[index].publicador = '';
                MOCK_DATA[index].fechaInicio = '';
                MOCK_DATA[index].fechaFin = '';
            } else {
                MOCK_DATA[index].historial.push({
                    publicador: formData.publicador || "",
                    fechaInicio: formData.fechaInicio,
                    fechaFin: formData.fechaFin,
                    estado: formData.estado
                });
            }
            filterTerritories();
        }
        closeModal();
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
        return;
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(formData)
        });

        alert("¡Guardado correctamente!");
        closeModal();
        loadData();

    } catch (error) {
        console.error(error);
        alert("Hubo un error al guardar.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
    }
});

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { timeZone: 'UTC' }); 
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', loadData);
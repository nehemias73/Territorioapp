// ==========================================
// CONFIGURACIÓN
// ==========================================
// Pega aquí la URL que te dará Google Apps Script al implementar
const API_URL = "https://script.google.com/macros/s/AKfycbzDATJ31toch1A-7pgL2H2IIJqcbHVVHKcJfoxhmwso17sMnwl_vygoUlg5Xb_6wsDk/exec"; 

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
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = currentTerritories.filter(t => {
        const nameMatch = t.nombre.toLowerCase().includes(searchTerm);
        const idMatch = t.id.toString().includes(searchTerm);
        const pubMatch = t.publicador && t.publicador.toLowerCase().includes(searchTerm);
        return nameMatch || idMatch || pubMatch;
    });
    
    renderGrid(filtered);
}

function renderGrid(data) {
    grid.innerHTML = '';
    
    if(data.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#666; grid-column: 1/-1;">No se encontraron territorios.</p>';
        return;
    }

    data.forEach(t => {
        let statusClass = t.estado.toLowerCase().replace(' ', '');
        if(statusClass.includes('incompleto')) statusClass = 'incompleto';
        if(statusClass.includes('completo') && !statusClass.includes('in')) statusClass = 'completo';
        
        const card = document.createElement('div');
        card.className = `card ${statusClass}`;
        
        // El clic en la tarjeta abre el modal
        card.onclick = (e) => {
            if(!e.target.classList.contains('btn-map')) openModal(t.id);
        };

        const mapBtn = t.mapaUrl 
            ? `<a href="${t.mapaUrl}" target="_blank" class="btn btn-map" style="margin-top:10px;">📍 Abrir Mapa</a>` 
            : '';

        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${t.nombre}</span>
                <span class="badge ${statusClass}">${t.estado}</span>
            </div>
            <div class="card-body">
                ${t.publicador ? `<div class="info-row">👤 ${t.publicador}</div>` : '<div class="info-row" style="color:#aaa;">Sin asignar</div>'}
                ${t.fechaInicio ? `<div class="info-row">📅 Desde: ${formatDate(t.fechaInicio)}</div>` : ''}
                ${t.estado === 'Incompleto' && t.notas ? `<div class="info-row" style="color:var(--color-warning); font-size:0.85rem;">📝 <i>${t.notas}</i></div>` : ''}
            </div>
            ${t.mapaUrl ? `<div class="card-actions">${mapBtn}</div>` : ''}
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
    document.getElementById('mapaUrl').value = t.mapaUrl || ""; // Cargar link
    
    document.getElementById('dateStart').value = t.fechaInicio ? new Date(t.fechaInicio).toISOString().split('T')[0] : '';
    document.getElementById('dateEnd').value = t.fechaFin ? new Date(t.fechaFin).toISOString().split('T')[0] : '';

    const mediaPreview = document.getElementById('mediaPreview');
    if (t.imagen && t.imagen.startsWith('http')) {
        mediaPreview.innerHTML = `<img src="${t.imagen}" alt="Mapa Imagen">`;
    } else {
        mediaPreview.innerHTML = `<span>🗺️ Sin imagen de mapa</span>`;
    }

    const mapLinkContainer = document.getElementById('mapLinkContainer');
    if (t.mapaUrl && t.mapaUrl.startsWith('http')) {
        mapLinkContainer.innerHTML = `<a href="${t.mapaUrl}" target="_blank" class="btn btn-map">📍 Ver ubicación en Google Maps</a>`;
    } else {
        mapLinkContainer.innerHTML = '';
    }

    toggleFields();
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

function toggleFields() {
    const status = document.getElementById('status').value;
    const groupNotes = document.getElementById('groupNotes');
    
    if (status === 'Incompleto') {
        groupNotes.style.display = 'block';
    } else {
        groupNotes.style.display = 'none';
    }
}

// --- FUNCIÓN S-13 VERTICAL ACTUALIZADA ---
function printS13() {
    const currentYear = new Date().getFullYear();
    const serviceYear = `${currentYear}/${currentYear + 1}`;

    const sortedData = [...currentTerritories].sort((a, b) => {
        return parseInt(a.id) - parseInt(b.id) || a.id.localeCompare(b.id);
    });

    let rows = '';
    sortedData.forEach(t => {
        const inicio = t.fechaInicio ? formatDateShort(t.fechaInicio) : '&nbsp;';
        const isComplete = t.estado === 'Completo';
        const fin = (isComplete && t.fechaFin) ? formatDateShort(t.fechaFin) : '&nbsp;';
        const pub = t.publicador || '&nbsp;';
        
        // Generamos la celda de asignación con la estructura interna: Nombre arriba, Fechas abajo
        const cellContent = `
            <div class="cell-name">${pub}</div>
            <div class="cell-dates">
                <span class="date-box" style="border-right: 1px solid #000;">${inicio}</span>
                <span class="date-box">${fin}</span>
            </div>
        `;
        
        // Celda vacía para los bloques futuros
        const emptyCell = `
            <div class="cell-name">&nbsp;</div>
            <div class="cell-dates">
                <span class="date-box" style="border-right: 1px solid #000;">&nbsp;</span>
                <span class="date-box">&nbsp;</span>
            </div>
        `;

        rows += `
            <tr>
                <td style="text-align: center; font-weight: bold; vertical-align: middle;">${t.id}</td>
                <td></td> <!-- Última fecha completó -->
                
                <!-- BLOQUE 1 (Datos Actuales) -->
                <td class="col-assign">${cellContent}</td>
                
                <!-- BLOQUES 2, 3, 4 (Vacíos) -->
                <td class="col-assign">${emptyCell}</td>
                <td class="col-assign">${emptyCell}</td>
                <td class="col-assign">${emptyCell}</td>
            </tr>
        `;
    });

    const printContent = `
        <html>
        <head>
            <title>S-13 Registro de Territorio</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
                
                body { 
                    font-family: 'Noto Sans', 'Arial', sans-serif; 
                    padding: 0; 
                    margin: 0;
                    color: #000; 
                    font-size: 10px;
                }
                
                .header-container { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-end; 
                    margin-bottom: 5px;
                    padding-bottom: 5px;
                }
                
                .main-title { 
                    font-weight: bold; 
                    font-size: 14px; 
                    text-transform: uppercase; 
                    text-align: center;
                    flex-grow: 1;
                }
                
                .service-year { 
                    font-size: 11px; 
                    position: absolute;
                    left: 0;
                    top: 0;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    border: 2px solid #000;
                    table-layout: fixed;
                }
                
                th, td { 
                    border: 1px solid #000; 
                    padding: 0; 
                    vertical-align: middle; 
                }
                
                th { 
                    text-align: center; 
                    background-color: #fff; 
                    font-weight: bold;
                    font-size: 8px;
                    padding: 2px;
                }
                
                /* Anchos de columna VERTICAL */
                .th-num { width: 5%; }
                .th-last { width: 10%; }
                .col-assign { width: 21.25%; } /* (100 - 15) / 4 */
                
                /* Estilos internos de celda de asignación */
                .cell-name {
                    border-bottom: 1px solid #000;
                    min-height: 16px;
                    padding: 2px 4px;
                    font-size: 10px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .cell-dates {
                    display: flex;
                    height: 14px;
                }
                
                .date-box {
                    flex: 1;
                    text-align: center;
                    font-size: 9px;
                    line-height: 14px;
                }

                .footer {
                    margin-top: 5px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 8px;
                }

                @media print {
                    @page { 
                        size: portrait; /* VERTICAL */
                        margin: 1cm; 
                    }
                    body { -webkit-print-color-adjust: exact; }
                }
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
                        
                        <!-- Encabezados de Asignación (x4) -->
                        <th class="col-assign">Asignado a</th>
                        <th class="col-assign">Asignado a</th>
                        <th class="col-assign">Asignado a</th>
                        <th class="col-assign">Asignado a</th>
                    </tr>
                    <tr>
                        <!-- Sub-encabezados visuales dentro de cada columna -->
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;">
                                <span>F. Asignó</span><span>F. Completó</span>
                            </div>
                        </th>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;">
                                <span>F. Asignó</span><span>F. Completó</span>
                            </div>
                        </th>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;">
                                <span>F. Asignó</span><span>F. Completó</span>
                            </div>
                        </th>
                        <th>
                            <div style="border-bottom:1px solid #ccc; font-size:9px;">Nombre</div>
                            <div style="display:flex; justify-content:space-around; font-size:8px;">
                                <span>F. Asignó</span><span>F. Completó</span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
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
        mapaUrl: document.getElementById('mapaUrl').value
    };

    if (!API_URL) {
        alert("Modo Demo: Guardado localmente.");
        const index = MOCK_DATA.findIndex(x => x.id == formData.id);
        if(index !== -1) {
            MOCK_DATA[index] = { ...MOCK_DATA[index], ...formData };
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

// Formato corto para la tabla impresa (DD/MM/YY) para ahorrar espacio
function formatDateShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', loadData);
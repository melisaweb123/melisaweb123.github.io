document.addEventListener("DOMContentLoaded", async function () {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/${file}`
    });

    let db;

    const storedDb = localStorage.getItem("db");
    if (storedDb) {
        const uInt8Array = new Uint8Array(JSON.parse(storedDb));
        db = new SQL.Database(uInt8Array);
    } else {
        db = new SQL.Database();
        db.run(`
            CREATE TABLE fabricante (
                codigo NUMERIC(18, 0) PRIMARY KEY,
                nombre VARCHAR(50)
            );
            
            CREATE TABLE articulo (
                codigo NUMERIC(18, 0) PRIMARY KEY,
                nombre VARCHAR(50),
                precio INT,
                codigofabricante NUMERIC(18, 0),
                FOREIGN KEY (codigofabricante) REFERENCES fabricante(codigo)
            );
        `);
    }

    function saveDatabase() {
        try {
            const data = db.export();
            localStorage.setItem("db", JSON.stringify(Array.from(data)));
        } catch (error) {
            console.error("Error guardando la base de datos:", error);
        }
    }

    function exportDatabase() {
        const data = db.export();
        const blob = new Blob([JSON.stringify(Array.from(data))], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Andrea.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function importDatabase(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const uInt8Array = new Uint8Array(JSON.parse(event.target.result));
                db = new SQL.Database(uInt8Array);
                updateTables();
                saveDatabase();
            } catch (error) {
                console.error("Error importando la base de datos:", error);
            }
        };
        reader.readAsText(file);
    }

    function updateTables() {
        updateArticuloTable();
    }

    function updateArticuloTable() {
        const res = db.exec("SELECT * FROM articulo");
        const rows = res[0]?.values || [];
        const articuloTable = document.getElementById("articuloTable").querySelector("tbody");

        articuloTable.innerHTML = rows.map(row => `
            <tr>
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td>${row[2]}</td>
                <td>${row[3]}</td>
                <td><button onclick="deleteArticulo(${row[0]})">Eliminar</button></td>
            </tr>
        `).join("");
    }

    document.getElementById("articuloForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const codigo = document.getElementById("articuloCodigo").value;
        const nombre = document.getElementById("articuloNombre").value;
        const precio = document.getElementById("articuloPrecio").value;
        const codigofabricante = document.getElementById("articuloCodigoFabricante").value;

        db.run("INSERT INTO articulo (codigo, nombre, precio, codigofabricante) VALUES (?, ?, ?, ?)", [codigo, nombre, precio, codigofabricante]);

        updateArticuloTable();
        saveDatabase();

        this.reset();
    });

    window.deleteArticulo = function (codigo) {
        db.run("DELETE FROM articulo WHERE codigo = ?", [codigo]);
        updateArticuloTable();
        saveDatabase();
    }

    window.executeQuery = function (query) {
        try {
            const res = db.exec(query);
            const rows = res[0]?.values || [];
            const columns = res[0]?.columns || [];
            const resultsDiv = document.getElementById("queryResults");

            if (rows.length > 0) {
                let table = "<table class='result-table'><thead><tr>";
                columns.forEach(col => {
                    table += `<th>${col}</th>`;
                });
                table += "</tr></thead><tbody>";

                rows.forEach(row => {
                    table += "<tr>";
                    row.forEach(cell => {
                        table += `<td>${cell}</td>`;
                    });
                    table += "</tr>";
                });

                table += "</tbody></table>";
                resultsDiv.innerHTML = table;
            } else {
                resultsDiv.innerHTML = "No se encontraron resultados.";
            }
        } catch (error) {
            alert("Error en la consulta SQL: " + error.message);
        }
    }

    document.getElementById("exportBtn").addEventListener("click", exportDatabase);
    document.getElementById("importFile").addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            importDatabase(file);
        }
    });

    updateTables();
});


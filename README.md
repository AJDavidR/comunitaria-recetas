# 🍽️ Recetas Gourmet

## 📄 Descripción

Este proyecto fue desarrollado en el marco de la asignatura **PSP - Proceso de Software Personal**.  
Es una aplicación web ligera y funcional que permite a los usuarios **consultar, agregar y explorar recetas de cocina** en un entorno intuitivo y organizado por categorías. Además, se integran visualizaciones dinámicas para analizar los datos de forma gráfica.

---

## 🛠 Tecnologías empleadas

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</div>

---

## ✨ Principales características

- ✅ **Agregar recetas** con título, imagen, ingredientes, pasos y categoría.
- 🖼️ **Soporte para imágenes remotas o locales.**
- 📂 **Las recetas se almacenan en** `localStorage` **y/o se cargan desde** `data/recetas.json`.
- 📊 **Gráfico dinámico** con la cantidad de recetas por categoría usando **Chart.js**.
- 📚 **Vista detallada** de cada receta (con imagen, ingredientes y pasos).
- 📥 **Exportar recetas** a un archivo `.json` con un solo clic.
- ⚡ **Interfaz adaptada** para escritorio y dispositivos móviles.

---

## 🧱 Estructura del proyecto

```plaintext
comunitaria-recetas/
├── index.html
├── agregar.html
├── receta.html
├── categorias.html
├── css/
│   ├── variables.css
│   └── styles.css
├── js/
│   ├── recetas.js
│   ├── categorias.js
│   ├── validaciones.js
│   └── main.js
├── data/
│   └── recetas.json
├── assets/
│   └── img/  (opcional para imágenes locales)
└── README.md

```
🚀 Cómo ejecutar el proyecto
Debido al uso de fetch() para cargar archivos locales (data/recetas.json), necesitas ejecutar el proyecto en un servidor local:

# Con Python 3
python -m http.server
Luego abre en tu navegador:


http://localhost:8000/index.html
📌 Estado actual y extensiones futuras
Este proyecto está preparado para crecer. Algunas funcionalidades en proceso o planificadas:

 🔍 Filtro por ingrediente o nombre de receta

 ✏️ Edición de recetas

 🗑️ Eliminación de recetas con confirmación

 📂 Importación de recetas desde archivo .json

 🎞️ Animaciones suaves con transiciones CSS

👨‍💻 Créditos
Desarrollado por los estudiantes del grupo B07-6 del Politécnico Grancolombiano como parte de la entrega del escenario 3 del curso PSP.
// Estado de la aplicación
let rawSiteData = null; // Contiene todo el JSON { es: {...}, it: {...} }
let siteData = null;    // Contiene el bloque del idioma activo (es o it)
let currentLang = "es"; // Idioma activo
let isEditMode = false;
let activeEditingImageElement = null;

// Esperar a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupNavbarScroll();
});

// Inicializar la aplicación
async function initApp() {
  try {
    const response = await fetch("data/content.json");
    if (!response.ok) throw new Error("No se pudo cargar el archivo de datos.");
    rawSiteData = await response.json();
    
    // Configurar idioma inicial (detectar si hay guardado en localStorage o usar 'es')
    currentLang = localStorage.getItem("selectedLang") || "es";
    siteData = rawSiteData[currentLang];
    
    // Renderizar contenidos
    renderPageContent();
    
    // Configurar selector de idioma
    setupLanguageSwitcher();
    
    // Comprobar estado de autenticación de administrador
    checkAdminAuth();
  } catch (error) {
    console.error("Error al inicializar la app:", error);
    showToast("Error al cargar la página", "error");
  }
}

// Configuración de la barra de navegación al hacer scroll
function setupNavbarScroll() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// Configurar los botones de idioma
function setupLanguageSwitcher() {
  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach(btn => {
    const lang = btn.getAttribute("data-lang");
    
    // Marcar el botón activo inicial
    btn.classList.toggle("active", lang === currentLang);
    
    btn.onclick = (e) => {
      e.preventDefault();
      if (currentLang === lang) return;
      
      // Cambiar idioma activo
      currentLang = lang;
      localStorage.setItem("selectedLang", currentLang);
      siteData = rawSiteData[currentLang];
      
      // Actualizar clases activas en botones
      buttons.forEach(b => b.classList.toggle("active", b.getAttribute("data-lang") === currentLang));
      
      // Volver a renderizar
      renderPageContent();
      
      // Si estamos en modo edición, volver a aplicar los contentEditable y los listeners
      if (isEditMode) {
        enableEditMode(false); // pasar false para evitar mostrar el toast de activación de nuevo
      }
      
      showToast(currentLang === "es" ? "Idioma cambiado a Español" : "Lingua cambiata in Italiano", "success");
    };
  });
}

// Renderizar todos los contenidos dinámicos del idioma seleccionado
function renderPageContent() {
  if (!siteData) return;

  // 0. Navbar Links
  if (siteData.nav) {
    document.getElementById("nav-home").innerText = siteData.nav.home;
    document.getElementById("nav-about").innerText = siteData.nav.about;
    document.getElementById("nav-services").innerText = siteData.nav.services;
    document.getElementById("nav-testimonials").innerText = siteData.nav.testimonials;
    document.getElementById("nav-contact").innerText = siteData.nav.contact;
  }

  // 1. Hero Section
  document.getElementById("hero-title").innerText = siteData.hero.title;
  document.getElementById("hero-subtitle").innerText = siteData.hero.subtitle;
  document.getElementById("hero-btn").innerText = siteData.hero.buttonText;
  document.getElementById("hero-btn").href = siteData.hero.buttonUrl;
  
  const heroSection = document.getElementById("inicio");
  heroSection.style.backgroundImage = `url('${siteData.hero.bgImage}')`;
  heroSection.setAttribute("data-field", "hero.bgImage");

  // 2. About Section
  document.getElementById("about-title").innerText = siteData.about.title;
  document.getElementById("about-text1").innerText = siteData.about.text1;
  document.getElementById("about-text2").innerText = siteData.about.text2;
  
  const aboutImg = document.getElementById("about-image");
  aboutImg.src = siteData.about.image;
  aboutImg.setAttribute("data-field", "about.image");

  // 3. Services Section
  document.getElementById("services-title").innerText = siteData.services.title;
  document.getElementById("services-subtitle").innerText = siteData.services.subtitle;
  
  const servicesContainer = document.getElementById("services-list-container");
  servicesContainer.innerHTML = "";
  
  siteData.services.list.forEach((service, index) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <div class="service-card-image img-editable-container">
        <img src="${service.image}" alt="${service.name}" data-field="services.list[${index}].image">
      </div>
      <div class="service-card-content">
        <div class="service-meta">
          <span class="service-price" data-field="services.list[${index}].price">${service.price}</span>
          <span class="service-duration" data-field="services.list[${index}].duration">${service.duration}</span>
        </div>
        <h3 data-field="services.list[${index}].name">${service.name}</h3>
        <p data-field="services.list[${index}].description">${service.description}</p>
        <a href="#contacto" class="btn-primary" data-field="services.buttonText" style="margin-top: auto; text-align: center; font-size: 0.75rem; padding: 10px 20px;">
          ${siteData.services.buttonText || (currentLang === "es" ? "Reservar" : "Prenota")}
        </a>
      </div>
    `;
    servicesContainer.appendChild(card);
  });

  // 4. Testimonials Section
  document.getElementById("testimonials-title").innerText = siteData.testimonials.title;
  
  const testimonialsContainer = document.getElementById("testimonials-list-container");
  testimonialsContainer.innerHTML = "";
  
  siteData.testimonials.list.forEach((t, index) => {
    const card = document.createElement("div");
    card.className = "testimonial-card";
    card.innerHTML = `
      <p class="testimonial-text" data-field="testimonials.list[${index}].quote">${t.quote}</p>
      <div class="testimonial-author">
        <h4 data-field="testimonials.list[${index}].author">${t.author}</h4>
        <span data-field="testimonials.list[${index}].role">${t.role}</span>
      </div>
    `;
    testimonialsContainer.appendChild(card);
  });

  // 5. Contact Section & Labels
  document.getElementById("contact-title").innerText = siteData.contact.title;
  document.getElementById("contact-address").innerText = siteData.contact.address;
  document.getElementById("contact-phone").innerText = siteData.contact.phone;
  
  const whatsappSpan = document.getElementById("contact-whatsapp");
  if (whatsappSpan) whatsappSpan.innerText = siteData.contact.phone;
  
  document.getElementById("contact-whatsapp-link").href = `https://wa.me/${siteData.contact.whatsapp}`;
  document.getElementById("contact-email").innerText = siteData.contact.email;
  document.getElementById("contact-hours").innerText = siteData.contact.hours;
  
  // Renderizar las etiquetas de contacto dinámicas
  document.getElementById("label-address").innerText = siteData.contact.labelAddress;
  document.getElementById("label-phone").innerText = siteData.contact.labelPhone;
  document.getElementById("label-whatsapp").innerText = siteData.contact.labelWhatsapp;
  document.getElementById("label-email").innerText = siteData.contact.labelEmail;
  document.getElementById("label-hours").innerText = siteData.contact.labelHours;

  // Renderizar las etiquetas y placeholders del formulario
  document.getElementById("form-title").innerText = siteData.contact.formTitle;
  document.getElementById("form-label-name").innerText = siteData.contact.formName;
  document.getElementById("form-name").placeholder = siteData.contact.formNamePlaceholder;
  document.getElementById("form-label-email").innerText = siteData.contact.formEmail;
  document.getElementById("form-email").placeholder = siteData.contact.formEmailPlaceholder;
  document.getElementById("form-label-service").innerText = siteData.contact.formService;
  document.getElementById("form-label-date").innerText = siteData.contact.formDate;
  document.getElementById("form-submit-btn").innerText = siteData.contact.formSubmit;

  // Rellenar dinámicamente las opciones del selector de servicios
  const serviceSelect = document.getElementById("form-service");
  serviceSelect.innerHTML = "";
  
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.innerText = siteData.contact.formServiceSelect;
  serviceSelect.appendChild(defaultOpt);
  
  siteData.services.list.forEach(service => {
    const opt = document.createElement("option");
    opt.value = service.id;
    opt.innerText = service.name;
    serviceSelect.appendChild(opt);
  });

  // Configurar la alerta del formulario
  const bookingForm = document.getElementById("booking-form");
  bookingForm.onsubmit = (e) => {
    e.preventDefault();
    alert(siteData.contact.formAlert);
    bookingForm.reset();
  };

  // Actualizar redes sociales si existen
  if (siteData.contact.facebookUrl) {
    document.getElementById("contact-facebook").href = siteData.contact.facebookUrl;
  }
  if (siteData.contact.instagramUrl) {
    document.getElementById("contact-instagram").href = siteData.contact.instagramUrl;
  }
}

// Comprobar si el administrador ha iniciado sesión
function checkAdminAuth() {
  const token = localStorage.getItem("adminToken");
  if (token === "session_token_zenvibe_2026") {
    enableEditMode(true);
  }
}

// Activar el modo de edición
function enableEditMode(showNotification = true) {
  isEditMode = true;
  document.body.classList.add("edit-mode");
  
  // Hacer que todos los elementos con data-field sean editables
  const editableElements = document.querySelectorAll("[data-field]");
  
  editableElements.forEach(el => {
    const fieldPath = el.getAttribute("data-field");
    
    // Evitar editar imágenes de fondo del hero directamente como texto
    if (el.tagName === "SECTION" && fieldPath === "hero.bgImage") {
      setupHeroBackgroundEditor(el);
      return;
    }
    
    if (el.tagName === "IMG") {
      setupImageEditor(el);
      return;
    }
    
    // Configurar elementos de texto
    el.contentEditable = "true";
    
    // Prevenir el comportamiento por defecto de enlaces/botones en modo edición
    if (el.tagName === "A" || el.tagName === "BUTTON") {
      el.onclick = (e) => {
        if (isEditMode) e.preventDefault();
      };
      if (el.tagName === "BUTTON" && el.type === "submit") {
        el.type = "button";
      }
    }
    
    // Guardar cambios al escribir/perder el foco (se usa onblur directo para no duplicar listeners)
    el.onblur = () => {
      const newValue = el.innerText.trim();
      updateDataValue(fieldPath, newValue);
    };
  });
  
  // Agregar barra de herramientas del admin
  createAdminFloatingBar();
  
  // Configurar input de archivos para imágenes
  setupFileInputListener();
  
  if (showNotification) {
    showToast(currentLang === "es" ? "Modo de edición activado" : "Modalità modifica attivata", "success");
  }
}

// Guardar valor modificado en el objeto siteData (que por referencia actualiza rawSiteData[currentLang])
function updateDataValue(path, value) {
  if (!siteData) return;
  
  // Parsear ruta como services.list[0].name -> ['services', 'list', 0, 'name']
  const tokens = path.split(/\.|\[|\]/).filter(Boolean).map(t => isNaN(t) ? t : parseInt(t));
  
  let current = siteData;
  for (let i = 0; i < tokens.length - 1; i++) {
    current = current[tokens[i]];
  }
  current[tokens[tokens.length - 1]] = value;
}

// Configuración de edición de imágenes
function setupImageEditor(imgEl) {
  let container = imgEl.parentElement;
  if (!container.classList.contains("img-editable-container")) {
    container.classList.add("img-editable-container");
    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
  }
  
  // Evitar duplicar el overlay
  if (container.querySelector(".image-edit-overlay")) return;
  
  // Crear overlay
  const overlay = document.createElement("div");
  overlay.className = "image-edit-overlay";
  overlay.innerHTML = `
    <button class="btn-change-image">
      <i class="fa-solid fa-camera"></i> Cambiar
    </button>
  `;
  
  container.appendChild(overlay);
  
  // Evento para cambiar imagen
  overlay.querySelector(".btn-change-image").onclick = (e) => {
    e.preventDefault();
    activeEditingImageElement = imgEl;
    document.getElementById("admin-file-input").click();
  };
}

// Configuración de edición para la imagen de fondo del Hero
function setupHeroBackgroundEditor(heroSec) {
  if (document.getElementById("btn-hero-bg-edit")) return;
  
  const btn = document.createElement("button");
  btn.id = "btn-hero-bg-edit";
  btn.className = "btn-change-image";
  btn.style.position = "absolute";
  btn.style.top = "100px";
  btn.style.right = "30px";
  btn.style.zIndex = "10";
  btn.innerHTML = `<i class="fa-solid fa-image"></i> Cambiar Fondo`;
  
  heroSec.appendChild(btn);
  
  btn.onclick = (e) => {
    e.preventDefault();
    activeEditingImageElement = heroSec;
    document.getElementById("admin-file-input").click();
  };
}

// Configurar el listener del input file invisible
function setupFileInputListener() {
  const fileInput = document.getElementById("admin-file-input");
  
  // Eliminar listener previo si existía reasignando el handler
  fileInput.onchange = async () => {
    if (fileInput.files.length === 0 || !activeEditingImageElement) return;
    
    const file = fileInput.files[0];
    showToast(currentLang === "es" ? "Procesando imagen..." : "Elaborazione immagine...", "success");
    
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const base64Content = dataUrl.split(",")[1];
      
      showToast(currentLang === "es" ? "Subiendo imagen..." : "Caricamento immagine...", "success");
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64: base64Content
          })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Error al subir la imagen");
        
        const newImageUrl = result.imageUrl;
        
        // Actualizar el DOM y el JSON local
        if (activeEditingImageElement.tagName === "IMG") {
          activeEditingImageElement.src = newImageUrl;
          const fieldPath = activeEditingImageElement.getAttribute("data-field");
          updateDataValue(fieldPath, newImageUrl);
        } else if (activeEditingImageElement.tagName === "SECTION") {
          activeEditingImageElement.style.backgroundImage = `url('${newImageUrl}')`;
          const fieldPath = activeEditingImageElement.getAttribute("data-field");
          updateDataValue(fieldPath, newImageUrl);
        }
        
        showToast(currentLang === "es" ? "Imagen subida con éxito" : "Immagine caricata con successo", "success");
      } catch (error) {
        console.error(error);
        showToast(error.message || "Error al subir la imagen", "error");
      } finally {
        fileInput.value = "";
        activeEditingImageElement = null;
      }
    };
    
    reader.onerror = () => {
      showToast(currentLang === "es" ? "Error al leer el archivo" : "Errore durante la lettura del file", "error");
      fileInput.value = "";
      activeEditingImageElement = null;
    };
    
    reader.readAsDataURL(file);
  };
}

// Crear barra de herramientas flotante del administrador
function createAdminFloatingBar() {
  if (document.querySelector(".admin-floating-bar")) return;
  
  const bar = document.createElement("div");
  bar.className = "admin-floating-bar";
  bar.innerHTML = `
    <span class="admin-badge">Admin Mode</span>
    <div class="admin-bar-actions">
      <button class="btn-admin-save" id="btn-save-changes">
        <i class="fa-solid fa-save"></i> Guardar Cambios
      </button>
      <button class="btn-admin-logout" id="btn-admin-logout">
        <i class="fa-solid fa-sign-out-alt"></i> Salir
      </button>
    </div>
  `;
  
  document.body.appendChild(bar);
  
  // Entrada animada
  setTimeout(() => bar.classList.add("active"), 100);
  
  // Evento guardar
  document.getElementById("btn-save-changes").onclick = saveAllChanges;
  
  // Evento logout
  document.getElementById("btn-admin-logout").onclick = () => {
    localStorage.removeItem("adminToken");
    showToast(currentLang === "es" ? "Sesión cerrada. Recargando..." : "Sessione chiusa. Ricaricamento...", "success");
    setTimeout(() => location.reload(), 1500);
  };
}

// Guardar todos los cambios al servidor backend
async function saveAllChanges() {
  const saveBtn = document.getElementById("btn-save-changes");
  const originalHtml = saveBtn.innerHTML;
  
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
  
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // Enviamos rawSiteData con todas las lenguas estructuradas
      body: JSON.stringify(rawSiteData)
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Error al guardar los cambios");
    
    showToast(currentLang === "es" ? "¡Cambios guardados con éxito!" : "Modifiche salvate con successo!", "success");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Error al guardar los cambios", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
  }
}

// Mostrar notificaciones Toast
function showToast(message, type = "success") {
  let oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();
  
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const icon = type === "success" ? "fa-circle-check" : "fa-circle-xmark";
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("show"), 100);
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

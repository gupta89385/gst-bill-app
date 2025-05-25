// app.js
const loadedScripts = {}; // Keep track of loaded component scripts
const componentInitializers = {}; // Store component initialization functions

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') // Ensure path is correct
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('hamburger').addEventListener('click', openMenu);
    document.getElementById('menu-overlay').addEventListener('click', closeMenu);

    // Global function for components to register their init function
    window.registerComponentModule = (name, initFunction) => {
        componentInitializers[name] = initFunction;
    };

    loadTab('sales'); // Load default tab
});

function openMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('-translate-x-full');
    document.getElementById('menu-overlay').classList.remove('hidden');
}

function closeMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('-translate-x-full');
    document.getElementById('menu-overlay').classList.add('hidden');
}

async function loadTab(name) {
    const main = document.getElementById('main-content');
    main.innerHTML = '<p class="text-center py-10 animate-pulse">Loading...</p>'; // Clearer loading state

    const basePath = `components/${name}/${name}`;
    const htmlPath = `${basePath}.html`;
    const cssPath = `${basePath}.css`;
    const jsPath = `${basePath}.js`;

    // 1. Load CSS (or update if already loaded and changed)
    let dynamicStyle = document.getElementById('dynamic-style');
    if (dynamicStyle && dynamicStyle.href !== new URL(cssPath, window.location.href).href) {
        dynamicStyle.remove();
        dynamicStyle = null;
    }
    if (!dynamicStyle) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        link.id = 'dynamic-style';
        document.head.appendChild(link);
    }

    try {
        // 2. Load HTML
        const htmlRes = await fetch(htmlPath);
        if (!htmlRes.ok) throw new Error(`Failed to load HTML for ${name}: ${htmlRes.status}`);
        const html = await htmlRes.text();
        main.innerHTML = html;
        void main.offsetWidth; // Force reflow for animation
        main.classList.remove('fade-enter-active'); // Remove if re-adding
        main.classList.add('fade-enter');
        // Add a class to signal animation start, then remove it
        setTimeout(() => main.classList.add('fade-enter-active'), 0);


        // 3. Load and execute JS
        if (!loadedScripts[name]) {
            const script = document.createElement('script');
            script.src = jsPath;
            script.type = 'text/javascript';
            script.id = `script-${name}`;
            script.onload = () => {
                loadedScripts[name] = true;
                if (componentInitializers[name]) {
                    componentInitializers[name](); // Call the registered init function
                } else {
                    console.warn(`No initializer function registered for component: ${name}. Ensure ${name}.js calls window.registerComponentModule('${name}', yourInitFunction);`);
                }
            };
            script.onerror = () => {
                console.error(`Failed to load script: ${jsPath}`);
                main.innerHTML = `<p class="text-red-500 text-center py-10">Error loading component's script.</p>`;
            };
            document.body.appendChild(script);
        } else {
            // Script already loaded, just call its init function
            if (componentInitializers[name]) {
                componentInitializers[name]();
            } else {
                console.warn(`Component ${name} script loaded but no initializer found on subsequent loads.`);
            }
        }
    } catch (error) {
        console.error(`Error loading tab ${name}:`, error);
        main.innerHTML = `<p class="text-red-500 text-center py-10">Error loading ${name}. Please check the console.</p>`;
    }
}


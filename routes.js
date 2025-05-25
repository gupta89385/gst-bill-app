const openTabs = new Map();

export async function openTab(name) {
    if (openTabs.has(name)) {
        setActiveTab(name);
        return;
    }

    const container = document.createElement('div');
    container.id = `tab-${name}`;
    container.classList.add('tab-content');
    container.style.display = 'none';

    try {
        const html = await fetch(`components/${name}/${name}.html`).then(r => r.text());
        container.innerHTML = html;
        document.getElementById('tabs-container').appendChild(container);

        const jsModule = await import(`./components/${name}/${name}.js`);
        if (jsModule.init) jsModule.init();

        openTabs.set(name, container);
        addTabButton(name);
        setActiveTab(name);
    } catch (err) {
        container.innerHTML = `<div class="text-red-500">Error loading ${name}: ${err.message}</div>`;
    }
}

function addTabButton(name) {
    const tabBar = document.getElementById('tab-bar');
    const tab = document.createElement('div');
    tab.className = 'bg-white px-3 py-1 rounded shadow flex items-center gap-2';
    tab.id = `tab-button-${name}`;

    const label = document.createElement('span');
    label.textContent = name[0].toUpperCase() + name.slice(1);

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'text-red-500';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeTab(name);
    };

    tab.onclick = () => setActiveTab(name);
    tab.appendChild(label);
    tab.appendChild(closeBtn);
    tabBar.appendChild(tab);
}

function setActiveTab(name) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeTab = openTabs.get(name);
    const activeBtn = document.getElementById(`tab-btn-${name}`);
    if (activeTab) activeTab.style.display = 'block';
    if (activeBtn) activeBtn.classList.add('active');
}


function closeTab(name) {
    const tab = openTabs.get(name);
    if (tab) {
        tab.remove();
        openTabs.delete(name);
        document.getElementById(`tab-button-${name}`).remove();

        // Show last tab
        const lastTab = Array.from(openTabs.keys()).pop();
        if (lastTab) setActiveTab(lastTab);
    }
}

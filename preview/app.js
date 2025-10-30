const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');

function setActiveScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle('is-visible', screen.dataset.screen === screenId);
  });
  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.screen === screenId);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const { screen } = tab.dataset;
    setActiveScreen(screen);
  });
});

// Permite navegação por teclado
const tabList = document.querySelector('.tabs');
if (tabList) {
  tabList.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }

    const currentIndex = Array.from(tabs).findIndex((tab) =>
      tab.classList.contains('is-active'),
    );
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;

    tabs[nextIndex].focus();
    setActiveScreen(tabs[nextIndex].dataset.screen);
  });
}

// Define foco inicial para acessibilidade
const activeTab = document.querySelector('.tab.is-active');
if (activeTab) {
  activeTab.setAttribute('tabindex', '0');
  activeTab.focus();
}

tabs.forEach((tab) => {
  tab.setAttribute('tabindex', '0');
});

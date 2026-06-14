const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxkeRzdoZHWXpjJVmPhCxnDnCJS6PGubx8JlIgZZG-8FJxXSY4bCc_IzkoJwcNEbjUZ/exec';

const DAY_OPTIONS = [
	{ key: 'lundi', label: 'Lundi' },
	{ key: 'mardi', label: 'Mardi' },
	{ key: 'mercredi', label: 'Mercredi' },
	{ key: 'jeudi', label: 'Jeudi' },
	{ key: 'vendredi', label: 'Vendredi' },
	{ key: 'samedi', label: 'Samedi' },
	{ key: 'dimanche', label: 'Dimanche' },
];

const DAY_COLUMN_MAP = {
	lundi: { planning: 2, period: 3, choice: 4, attribution: 5, rajout: 6, checking: 7, heurePointage: 8 },
	mardi: { planning: 9, period: 10, choice: 11, attribution: 12, rajout: 13, checking: 14, heurePointage: 15 },
	mercredi: { planning: 16, period: 17, choice: 18, attribution: 19, rajout: 20, checking: 21, heurePointage: 22 },
	jeudi: { planning: 23, period: 24, choice: 25, attribution: 26, rajout: 27, checking: 28, heurePointage: 29 },
	vendredi: { planning: 30, period: 31, choice: 32, attribution: 33, rajout: 34, checking: 35, heurePointage: 36 },
	samedi: { planning: 37, period: 38, choice: 39, attribution: 40, rajout: 41, checking: 42, heurePointage: 43 },
	dimanche: { planning: 44, period: 45, choice: 46, attribution: 47, rajout: 48, checking: 49, heurePointage: 50 },
};

const SIMPLE_RAJOUT_COLUMN_INDEX = 51;
const NEW_COLLABORATOR_COLUMN_INDEX = 52;
const PHOTO_COLUMN_INDEX = 53;

const HERO_SLIDES = [
	{ src: './image/food.jpg', alt: 'Assortiment de plats et aliments frais' },
	{ src: './image/food1.png', alt: 'Plat de cantine présenté en image' },
	{ src: './image/Food2.jpg', alt: 'Service de repas en restauration collective' },
	{ src: './image/Food4.jpg', alt: 'Préparation d’un plat savoureux' },
	{ src: './image/plat.jpg', alt: 'Plat servi à la cantine' },
	{ src: './image/plat1.jpg', alt: 'Autre plat de cantine' },
];

const HERO_SLIDES_LEFT = HERO_SLIDES;
const HERO_SLIDES_RIZ = [
	{ src: './image/plat.jpg', alt: 'Plat de riz' },
	{ src: './image/plat1.jpg', alt: 'Plat de riz 2' },
	{ src: './image/Food2.jpg', alt: 'Plat principal' },
];
const HERO_SLIDES_DESSERTS = [
	{ src: './image/food.jpg', alt: 'Dessert ou gourmandise' },
	{ src: './image/food1.png', alt: 'Dessert présenté' },
	{ src: './image/Food4.jpg', alt: 'Dessert du jour' },
];

const state = {
	rows: [],
	days: DAY_OPTIONS,
	lastResults: [],
	selectedRajoutDays: [],
	selectedAttributionDays: [],
	selectedCollaboratorDays: [],
	currentSearchMatricule: '',
	formulaireSearchMatricule: '',
	searchPeriodMode: 'all',
	overviewHtml: '',
	heroSlideshow: null,
	simpleRajoutCount: 0,
	newCollaboratorCount: 0,
	takenCount: 0,
	notTakenCount: 0,
	dashboardDay: getTodayDayKey(),
	sidebarCollapsed: false,
	pendingSync: false,
};

const elements = {};

// ==================== STATISTIQUES ====================
let statsChart = null;
let pieChart = null;

const TIME_RANGES = {
	'10-11': { label: '10:00 - 11:00', min: 10, max: 11, color: '#10b981' },
	'11-12': { label: '11:00 - 12:00', min: 11, max: 12, color: '#34d399' },
	'12-13': { label: '12:00 - 13:00', min: 12, max: 13, color: '#f59e0b' },
	'13-14': { label: '13:00 - 14:00', min: 13, max: 14, color: '#fbbf24' },
	'14-15': { label: '14:00 - 15:00', min: 14, max: 15, color: '#f97316' },
	'15+':   { label: '15:00 et plus',   min: 15, max: 24, color: '#6b7280' },
	'all':   { label: 'Toutes', min: 0, max: 24, color: '#1f7a5a' }
};

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', () => {
	elements.totalRows = document.getElementById('totalRows');
	elements.noPlanningCount = document.getElementById('noPlanningCount');
	elements.noChoiceCount = document.getElementById('noChoiceCount');
	elements.simpleRajoutCount = document.getElementById('simpleRajoutCount');
	elements.newCollaboratorCount = document.getElementById('newCollaboratorCount');
	elements.takenCount = document.getElementById('takenCount');
	elements.notTakenCount = document.getElementById('notTakenCount');
	elements.dashboardDayFilter = document.getElementById('dashboardDayFilter');
	elements.searchForm = document.getElementById('searchForm');
	elements.matriculeInput = document.getElementById('matriculeInput');
	elements.formulaireSearchForm = document.getElementById('formulaireSearchForm');
	elements.formulaireMatriculeInput = document.getElementById('formulaireMatriculeInput');
	elements.collaboratorForm = document.getElementById('collaboratorForm');
	elements.collaboratorMatriculeInput = document.getElementById('collaboratorMatriculeInput');
	elements.collaboratorNameInput = document.getElementById('collaboratorNameInput');
	elements.collaboratorDayButtons = document.getElementById('collaboratorDayButtons');
	elements.collaboratorDays = document.getElementById('collaboratorDays');
	elements.collaboratorStatus = document.getElementById('collaboratorStatus');
	elements.resetButton = document.getElementById('resetButton');
	elements.formulaireResetButton = document.getElementById('formulaireResetButton');
	elements.rajoutForm = document.getElementById('rajoutForm');
	elements.rajoutMatriculeDisplay = document.getElementById('rajoutMatriculeDisplay');
	elements.rajoutDate = document.getElementById('rajoutDate');
	elements.rajoutJour = document.getElementById('rajoutJour');
	elements.rajoutDayButtons = document.getElementById('rajoutDayButtons');
	elements.rajoutStatus = document.getElementById('rajoutStatus');
	elements.rajoutSubmitButton = elements.rajoutForm ? elements.rajoutForm.querySelector('button[type="submit"]') : null;
	elements.attributionForm = document.getElementById('attributionForm');
	elements.attributionMatriculeDisplay = document.getElementById('attributionMatriculeDisplay');
	elements.attributionTargetInput = document.getElementById('attributionTargetInput');
	elements.attributionJour = document.getElementById('attributionJour');
	elements.attributionDayButtons = document.getElementById('attributionDayButtons');
	elements.attributionStatus = document.getElementById('attributionStatus');
	elements.attributionSubmitButton = elements.attributionForm ? elements.attributionForm.querySelector('button[type="submit"]') : null;
	elements.collaboratorOptions = document.getElementById('collaboratorOptions');
	elements.resultsHint = document.getElementById('resultsHint');
	elements.searchResults = document.getElementById('searchResults');
	elements.formulaireResults = document.getElementById('formulaireResults');
	elements.searchRajoutZone = document.getElementById('searchRajoutZone');
	elements.navFormulaireButton = document.getElementById('navFormulaireButton');
	elements.navRechercheButton = document.getElementById('navRechercheButton');
	elements.navRajoutButton = document.getElementById('navRajoutButton');
	elements.navExportButton = document.getElementById('navExportButton');
	elements.navStatsButton = document.getElementById('navStatsButton');
	elements.sidebarToggleButton = document.getElementById('sidebarToggleButton');
	elements.sidebar = document.querySelector('.sidebar');
	elements.rajoutList = document.getElementById('rajoutList');
	elements.exportDay = document.getElementById('exportDay');
	elements.exportButton = document.getElementById('exportButton');
	elements.exportStatus = document.getElementById('exportStatus');
	
	elements.statsDayFilter = document.getElementById('statsDayFilter');
	elements.statsTimeRangeFilter = document.getElementById('statsTimeRangeFilter');
	elements.refreshStatsButton = document.getElementById('refreshStatsButton');
	elements.statsTotalMeals = document.getElementById('statsTotalMeals');
	elements.statsTakenMeals = document.getElementById('statsTakenMeals');
	elements.statsNotTakenMeals = document.getElementById('statsNotTakenMeals');
	elements.statsAttributionCount = document.getElementById('statsAttributionCount');
	elements.statsRajoutCount = document.getElementById('statsRajoutCount');

	state.sidebarCollapsed = readSidebarCollapsedState();
	if (isMobileViewport()) state.sidebarCollapsed = false;
	applySidebarCollapsedState(state.sidebarCollapsed);

	loadUiState();
	if (elements.exportDay && !elements.exportDay.value) elements.exportDay.value = getTodayDayKey();

	if (elements.rajoutDate) setDefaultRajoutDate();
	if (elements.rajoutJour) {
		renderRajoutDayOptions();
		setDefaultRajoutJour();
	}
	if (elements.attributionJour) {
		renderAttributionDayOptions();
		setDefaultAttributionJour();
	}
	if (elements.collaboratorDayButtons) {
		renderCollaboratorDayOptions();
		setDefaultCollaboratorDays();
	}
	bindEvents();
	adjustSidebarRajoutVisibility();
	showSection('page-recherche');
	setActiveNav(elements.navRechercheButton);
	positionRajoutForm('page-recherche');
	initializeHeroSlideshow();
	loadData();
});

// ==================== FONCTIONS UTILITAIRES ====================
function scrollToSection(sectionId) {
	const section = document.getElementById(sectionId);
	if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Petit utilitaire debounce pour éviter trop de rendus pendant la frappe
function debounce(fn, wait) {
	let t = null;
	return function(...args) {
		if (t) clearTimeout(t);
		t = setTimeout(() => { fn.apply(this, args); }, wait || 200);
	};
}

function adjustSidebarRajoutVisibility(pageId) {
	const wrapper = document.getElementById('sidebarRajoutMetric');
	if (!wrapper) return;
	const isRajoutPage = pageId ? pageId === 'page-rajout' : document.body.classList.contains('page-rajout-active');
	wrapper.style.display = isRajoutPage ? '' : 'none';
}

function adjustRajoutSectionVisibility(pageId) {
	const section = document.getElementById('page-rajout');
	if (!section) return;
	const isRajoutPage = pageId ? pageId === 'page-rajout' : document.body.classList.contains('page-rajout-active');
	section.style.display = isRajoutPage ? '' : 'none';
}

function ensureSidebarRajoutContainer() {
	return elements.searchRajoutZone || null;
}

function positionRajoutForm(pageId) {
	if (!elements.rajoutForm) return;
	const isRajoutPage = pageId === 'page-recherche';
	const sidebarContainer = ensureSidebarRajoutContainer();
	if (sidebarContainer) sidebarContainer.style.display = isRajoutPage ? '' : 'none';
}

function setRajoutSubmittingState(isSubmitting) {
	if (!elements.rajoutSubmitButton) return;
	if (!elements.rajoutSubmitButton.dataset.originalLabel) {
		elements.rajoutSubmitButton.dataset.originalLabel = elements.rajoutSubmitButton.textContent || 'Rajout';
	}
	elements.rajoutSubmitButton.disabled = isSubmitting;
	elements.rajoutSubmitButton.textContent = isSubmitting ? '✓ Validé' : elements.rajoutSubmitButton.dataset.originalLabel;
	if (!isSubmitting) {
		setTimeout(() => {
			if (elements.rajoutSubmitButton) elements.rajoutSubmitButton.textContent = elements.rajoutSubmitButton.dataset.originalLabel;
		}, 1500);
	}
}

function resetRajoutFormState() {
	if (elements.rajoutForm) elements.rajoutForm.reset();
	if (elements.rajoutDate) elements.rajoutDate.value = '';
	setDefaultRajoutJour();
	setRajoutMatricule('');
	state.currentSearchMatricule = '';
	if (elements.rajoutStatus) elements.rajoutStatus.textContent = '';
	setRajoutSubmittingState(false);
}

function setAttributionSubmittingState(isSubmitting) {
	if (!elements.attributionSubmitButton) return;
	if (!elements.attributionSubmitButton.dataset.originalLabel) {
		elements.attributionSubmitButton.dataset.originalLabel = elements.attributionSubmitButton.textContent || 'Valider attribution';
	}
	elements.attributionSubmitButton.disabled = isSubmitting;
	elements.attributionSubmitButton.textContent = isSubmitting ? '✓ Validé' : elements.attributionSubmitButton.dataset.originalLabel;
	if (!isSubmitting) {
		setTimeout(() => {
			if (elements.attributionSubmitButton) elements.attributionSubmitButton.textContent = elements.attributionSubmitButton.dataset.originalLabel;
		}, 1500);
	}
}

// ==================== BIND EVENTS ====================
function bindEvents() {
	if (elements.searchForm) elements.searchForm.addEventListener('submit', onSearch);
	if (elements.formulaireSearchForm) elements.formulaireSearchForm.addEventListener('submit', onFormulaireSearch);
	if (elements.collaboratorForm) elements.collaboratorForm.addEventListener('submit', onCollaboratorSubmit);
	if (elements.resetButton) elements.resetButton.addEventListener('click', resetSearch);
	if (elements.formulaireResetButton) elements.formulaireResetButton.addEventListener('click', resetFormulaireSearch);
	if (elements.searchResults) elements.searchResults.addEventListener('click', onSearchResultsClick);
	if (elements.formulaireResults) elements.formulaireResults.addEventListener('click', onFormulaireMealClick);
	if (elements.rajoutForm) elements.rajoutForm.addEventListener('submit', onRajoutSubmit);
	if (elements.attributionForm) elements.attributionForm.addEventListener('submit', onAttributionSubmit);
	if (elements.dashboardDayFilter) {
		elements.dashboardDayFilter.value = state.dashboardDay;
		elements.dashboardDayFilter.addEventListener('change', () => {
			state.dashboardDay = elements.dashboardDayFilter.value || getTodayDayKey();
			updateDashboardMealCounts();
		});
	}
	
	bindNavButton(elements.navFormulaireButton, 'page-formulaire');
	bindNavButton(elements.navRechercheButton, 'page-recherche');
	bindNavButton(elements.navRajoutButton, 'page-rajout');
	
	if (elements.navExportButton) {
		elements.navExportButton.addEventListener('click', () => {
			showSection('page-export');
			setActiveNav(elements.navExportButton);
		});
	}
	
	if (elements.navStatsButton) {
		bindNavButton(elements.navStatsButton, 'page-stats');
	}
	
	if (elements.refreshStatsButton) {
		elements.refreshStatsButton.addEventListener('click', updateStatistics);
	}
	
	if (elements.statsDayFilter) {
		elements.statsDayFilter.addEventListener('change', updateStatistics);
	}
	
	if (elements.statsTimeRangeFilter) {
		elements.statsTimeRangeFilter.addEventListener('change', updateStatistics);
	}
	
	if (elements.exportButton) elements.exportButton.addEventListener('click', onExportClick);
	
	if (elements.matriculeInput) {
		elements.matriculeInput.addEventListener('input', () => {
			if (!elements.matriculeInput.value.trim()) showIdleState();
		});
	}

	// Recherche en direct dans la fiche "Formulaire" (sans cliquer sur Rechercher)
	if (elements.formulaireMatriculeInput) {
		elements.formulaireMatriculeInput.addEventListener('input', debounce(() => {
			const v = String(elements.formulaireMatriculeInput.value || '').trim();
			state.formulaireSearchMatricule = normalizeText(v);
			saveUiState();
			if (!state.formulaireSearchMatricule) showFormulaireIdleState();
			else renderCurrentFormulaireSearch();
		}, 250));
	}
	
	if (elements.sidebarToggleButton) {
		elements.sidebarToggleButton.addEventListener('click', toggleSidebarCollapsed);
	}
}

function bindNavButton(button, sectionId) {
	if (!button) return;
	button.addEventListener('click', () => {
		showSection(sectionId);
		setActiveNav(button);
	});
}

// ==================== SIDEBAR GESTION ====================
function readSidebarCollapsedState() {
	try { return window.localStorage.getItem('cantine.sidebarCollapsed') === 'true'; } catch (error) { return false; }
}

function applySidebarCollapsedState(isCollapsed) {
	state.sidebarCollapsed = Boolean(isCollapsed);
	document.body.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
	if (elements.sidebarToggleButton) {
		elements.sidebarToggleButton.textContent = state.sidebarCollapsed ? '▶' : '◀';
		elements.sidebarToggleButton.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
	}
	if (elements.sidebar) elements.sidebar.setAttribute('data-collapsed', String(state.sidebarCollapsed));
	try { window.localStorage.setItem('cantine.sidebarCollapsed', String(state.sidebarCollapsed)); } catch (error) {}
}

function toggleSidebarCollapsed() {
	if (isMobileViewport()) return;
	applySidebarCollapsedState(!state.sidebarCollapsed);
}

function isMobileViewport() { return window.matchMedia && window.matchMedia('(max-width: 720px)').matches; }

// ==================== NAVIGATION ====================
function showSection(pageId) {
	const pages = ['page-formulaire', 'page-recherche', 'page-rajout', 'page-export', 'page-stats'];
	// remove any existing page-*-active body classes and add the current one
	try {
		document.body.classList.forEach(cls => {
			if (/^page-.*-active$/.test(cls)) document.body.classList.remove(cls);
		});
	} catch (e) {}
	document.body.classList.add(`${pageId}-active`);
	pages.forEach((id) => {
		const el = document.getElementById(id);
		if (el) {
			if (id === pageId) el.classList.add('active');
			else el.classList.remove('active');
		}
	});

	if (pageId === 'page-rajout') {
		document.body.classList.add('page-rajout-active');
		adjustRajoutSectionVisibility('page-rajout');
		positionRajoutForm('page-rajout');
		setHeroSlideshowPlaying(false);
		renderRajoutList();
		adjustSidebarRajoutVisibility('page-rajout');
	} else if (pageId === 'page-export') {
		document.body.classList.remove('page-rajout-active');
		adjustRajoutSectionVisibility('page-export');
		positionRajoutForm('page-export');
		setHeroSlideshowPlaying(false);
		adjustSidebarRajoutVisibility('page-export');
	} else if (pageId === 'page-recherche') {
		document.body.classList.remove('page-rajout-active');
		adjustRajoutSectionVisibility('page-recherche');
		positionRajoutForm('page-recherche');
		adjustSidebarRajoutVisibility('page-recherche');
		setHeroSlideshowPlaying(true);
		if (state.currentSearchMatricule) runCurrentSearch();
		else showIdleState();
	} else if (pageId === 'page-stats') {
		document.body.classList.remove('page-rajout-active');
		document.body.classList.add('page-stats-active');
		adjustRajoutSectionVisibility('page-stats');
		positionRajoutForm('page-stats');
		adjustSidebarRajoutVisibility('page-stats');
		setHeroSlideshowPlaying(false);
		updateStatistics();
	} else {
		document.body.classList.remove('page-stats-active');
		document.body.classList.remove('page-rajout-active');
		adjustRajoutSectionVisibility('page-formulaire');
		positionRajoutForm('page-formulaire');
		adjustSidebarRajoutVisibility('page-formulaire');
		setHeroSlideshowPlaying(true);
		renderCurrentFormulaireSearch();
	}

	if (pageId === 'page-rajout') {
		scrollToSection('page-rajout');
	} else {
		scrollToSection('topSection');
	}
}

function setActiveNav(button) {
	const buttons = [elements.navFormulaireButton, elements.navRechercheButton, elements.navRajoutButton, elements.navExportButton, elements.navStatsButton].filter(Boolean);
	buttons.forEach(b => b.classList.toggle('is-active', b === button));
}

// ==================== DATE ET JOUR ====================
function getTodayDayKey() {
	const mapping = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
	return mapping[new Date().getDay()] || 'lundi';
}

function getDayLabel(dayKey) {
	const day = DAY_OPTIONS.find((item) => item.key === dayKey);
	return day ? day.label : dayKey;
}

// ==================== GESTION DES REPAS ====================
function isDayReady(dayData) {
	const planningOk = hasMeaningfulPlanning(dayData?.planning);
	const choiceValue = String(dayData?.choice || '').trim();
	const choiceOk = choiceValue !== '' && !isMissingPlaceholder(choiceValue, ['pas de choix', 'aucun choix', 'choix', 'absent']);
	return planningOk && choiceOk;
}

function isDayChecked(dayData) {
	return normalizeText(dayData?.checking) === 'x' || String(dayData?.isChecked || '').toLowerCase() === 'true';
}

function setDayCheckedOptimistic(matricule, dayKey, checked) {
	const targetRow = (state.rows || []).find((row) => normalizeText(row.matricule).includes(normalizeText(matricule)));
	if (!targetRow || !targetRow.days || !targetRow.days[dayKey]) return null;
	const targetDay = targetRow.days[dayKey];
	targetDay.checking = checked ? 'X' : '';
	targetDay.isChecked = Boolean(checked);
	if (checked && !targetDay.heurePointage) targetDay.heurePointage = formatLocalTime(new Date());
	return targetRow;
}

function formatLocalTime(date) {
	const pad = (value) => String(value).padStart(2, '0');
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function isMealEligible(row, dayKey) {
	const dayData = row?.days?.[dayKey] || {};
	const isRajoutDay = Boolean(String(dayData.rajout || '').trim()) || Boolean(row?.rajouts?.[dayKey]);
	return isDayReady(dayData) || isRajoutDay || isCollaboratorAdded(row);
}

function computeMealDashboard(dayKey) {
	const rows = Array.isArray(state.rows) ? state.rows : [];
	const eligibleRows = rows.filter((row) => isMealEligible(row, dayKey) || isDayChecked(row.days?.[dayKey]));
	const takenCount = eligibleRows.filter((row) => isDayChecked(row.days?.[dayKey])).length;
	return { takenCount, notTakenCount: Math.max(eligibleRows.length - takenCount, 0) };
}

function updateDashboardMealCounts() {
	const dayKey = state.dashboardDay || getTodayDayKey();
	const counts = computeMealDashboard(dayKey);
	state.takenCount = counts.takenCount;
	state.notTakenCount = counts.notTakenCount;
	if (elements.takenCount) elements.takenCount.textContent = String(counts.takenCount);
	if (elements.notTakenCount) elements.notTakenCount.textContent = String(counts.notTakenCount);
}

function isCollaboratorAdded(row) { return Boolean(row?.isAddedCollaborator) || normalizeText(row?.source) === 'ajout_form'; }

function isMissingPlaceholder(value, placeholders) {
	const normalized = normalizeText(value);
	if (!normalized) return true;
	return placeholders.some(p => normalized === p || normalized.includes(p));
}

function isNonHourPlanningLabel(value) {
	const normalized = String(value || '').trim();
	const normalizedLower = normalized.toLowerCase();
	if (!normalized || normalizedLower === 'time' || normalizedLower === 'off') return true;
	if (/[a-zà-ÿ]/i.test(normalized) && !isHourPlanningValue(normalized)) return true;
	return false;
}

function hasMeaningfulPlanning(value) {
	const normalized = String(value || '').trim();
	if (!normalized) return false;
	if (isNonHourPlanningLabel(normalized)) return false;
	return !isMissingPlaceholder(normalized, ['pas de planning', 'aucun planning', 'planning']);
}

function isHourPlanningValue(value) {
	const normalized = String(value || '').trim().toLowerCase();
	if (!normalized) return false;
	return /^\d{1,2}$/.test(normalized) || /^\d{1,2}:\d{2}$/.test(normalized) || /^\d{1,2}:\d{2}:\d{2}$/.test(normalized) || /^\d{1,2}h\d{2}$/.test(normalized) || /^\d{1,2}h\d{2}:\d{2}$/.test(normalized) || /^\d{1,2}[:h]\d{2}\s*-\s*\d{1,2}[:h]\d{2}$/.test(normalized);
}

function getCollaboratorImageSrc(row) {
	const rawValue = String(row?.imageBase64 || '').trim();
	if (!rawValue) return '';
	if (rawValue.startsWith('data:')) return rawValue;
	return `data:image/png;base64,${rawValue}`;
}

// ==================== AFFICHAGE FORMULAIRE ====================
function getFormulaireDisplayState(row, dayData, dayKey) {
	const planningValue = String(dayData?.planning || '').trim();
	const periodValue = String(dayData?.period || '').trim();
	const choiceValue = String(dayData?.choice || '').trim();
	
	const isPlanningValid = hasMeaningfulPlanning(planningValue) && isHourPlanningValue(planningValue);
	const isShiftValid = periodValue !== '' && !isMissingPlaceholder(periodValue, ['pas de planning', 'aucun planning', 'planning', 'off', 'off ']);
	const isChoiceValid = choiceValue !== '' && !isMissingPlaceholder(choiceValue, ['pas de choix', 'aucun choix', 'choix', 'absent']);
	
	const isAdded = isCollaboratorAdded(row);
	const isRajoutDay = Boolean(String(dayData?.rajout || '').trim()) || Boolean(row && row.rajouts && row.rajouts[String(dayKey || '')]);
	const isRajout = isAdded || isRajoutDay;
	
	const hasAttribution = dayData?.attribution && String(dayData.attribution).trim() !== '';
	const isAttributedToOther = hasAttribution && normalizeText(dayData.attribution) !== normalizeText(row.matricule);
	
	if (isAttributedToOther) {
		return { className: 'is-attributed', badgeClass: 'is-attributed', label: 'Attribué', note: `Attribué à ${escapeHtml(dayData.attribution)}`, showAction: true, attributedTo: dayData.attribution };
	}
	if (!isChoiceValid) {
		return { className: 'is-red', badgeClass: 'is-red', label: '', note: '❌ Choix manquant ou absent', showAction: false };
	}
	if (isRajout) return { className: 'is-green', badgeClass: 'is-rajout-added', label: '', note: 'Rajouté', showAction: true };
	
	const allConditionsValid = isPlanningValid && isShiftValid && isChoiceValid;
	if (!allConditionsValid) {
		let errorMessage = '';
		if (!isShiftValid) errorMessage = '❌ Shift non valide (pas de planning/off)';
		else if (!isPlanningValid) errorMessage = '❌ Planning non valide (pas une heure)';
		return { className: 'is-red', badgeClass: 'is-red', label: '', note: errorMessage, showAction: false };
	}
	return { className: 'is-green', badgeClass: 'is-green', label: '', note: '✅ Prêt pour le repas', showAction: true };
}

// ==================== RECHERCHE ====================
function runCurrentSearch() {
	const searchValue = String(elements.matriculeInput && elements.matriculeInput.value || '').trim();
	const matricule = normalizeText(searchValue);
	if (!matricule) { showIdleState(); return; }
	const matches = state.rows.filter((row) => normalizeText(row.matricule).includes(matricule) || normalizeText(row.nomPrenom).includes(matricule));
	state.lastResults = matches;
	setRajoutMatricule(matricule);
	if (matches.length > 0) setRajoutDays(Object.keys(matches[0].rajouts || {}));
	else setRajoutDays([]);
	if (!matches.length) {
		elements.resultsHint.textContent = 'Aucun matricule correspondant.';
		renderResults([], `Aucun resultat pour "${escapeHtml(searchValue)}".`, true, 'all', elements.searchResults);
		return;
	}
	elements.resultsHint.textContent = `Recherche pour ${searchValue || matricule.toUpperCase()} - ${getDayLabel(getTodayDayKey())}.`;
	renderResults(matches, '', false, 'all', elements.searchResults);
	scrollToSection('topSection');
}

function onSearch(event) { event.preventDefault(); runCurrentSearch(); }

function onFormulaireSearch(event) {
	event.preventDefault();
	const searchValue = String(elements.formulaireMatriculeInput && elements.formulaireMatriculeInput.value || '').trim();
	state.formulaireSearchMatricule = normalizeText(searchValue);
	saveUiState();
	if (!state.formulaireSearchMatricule) { showFormulaireIdleState(); return; }
	renderCurrentFormulaireSearch();
	scrollToSection('topSection');
}

// ==================== ACTIONS REPAS (OPTIMISTES) ====================
function onFormulaireMealClick(event) {
	const button = event.target.closest('button[data-meal-action="take"]');
	if (!button) return;
	const matricule = button.getAttribute('data-meal-matricule')?.trim();
	const dayKey = button.getAttribute('data-meal-day')?.trim();
	if (!matricule || !dayKey) return;
	
	button.disabled = true;
	button.textContent = '✓ Validé';
	
	// Mise à jour optimiste
	setDayCheckedOptimistic(matricule, dayKey, true);
	renderCurrentFormulaireSearch();
	
	const params = new URLSearchParams({ action: 'markMealTaken', matricule, day: dayKey });
	loadJsonpSilent(`${WEB_APP_URL}?${params.toString()}`, 5000)
		.finally(() => {
			button.disabled = false;
			button.textContent = '🍽️ Marquer repas pris';
			silentRefresh();
		});
}

function onSearchResultsClick(event) {
	const button = event.target.closest('button[data-meal-action="take"]');
	if (!button) return;
	const container = event.currentTarget;
	const matricule = button.getAttribute('data-meal-matricule')?.trim();
	const dayKey = button.getAttribute('data-meal-day')?.trim();
	if (!matricule || !dayKey) return;
	
	button.disabled = true;
	button.textContent = '✓';
	
	setDayCheckedOptimistic(matricule, dayKey, true);
	if (container === elements.searchResults) runCurrentSearch();
	else renderCurrentFormulaireSearch();
	
	const params = new URLSearchParams({ action: 'markMealTaken', matricule, day: dayKey });
	loadJsonpSilent(`${WEB_APP_URL}?${params.toString()}`, 5000)
		.finally(() => {
			button.disabled = false;
			button.textContent = '🍽️';
			silentRefresh();
		});
}

// ==================== NOUVEAU COLLABORATEUR (OPTIMISTE) ====================
function onCollaboratorSubmit(event) {
	event.preventDefault();
	const matricule = elements.collaboratorMatriculeInput?.value.trim();
	const nomPrenom = elements.collaboratorNameInput?.value.trim();
	const jours = state.selectedCollaboratorDays.filter(Boolean);
	
	if (!matricule || !nomPrenom) {
		elements.collaboratorStatus.textContent = '❌ Le matricule et le nom sont obligatoires.';
		setTimeout(() => { if (elements.collaboratorStatus) elements.collaboratorStatus.textContent = ''; }, 2000);
		return;
	}
	if (!jours.length) {
		elements.collaboratorStatus.textContent = '❌ Sélectionnez au moins un jour.';
		setTimeout(() => { if (elements.collaboratorStatus) elements.collaboratorStatus.textContent = ''; }, 2000);
		return;
	}
	
	const existingRow = state.rows.find(row => normalizeText(row.matricule) === normalizeText(matricule));
	if (existingRow) {
		elements.collaboratorStatus.textContent = '❌ Ce matricule existe déjà. Utilisez "Rajout simple".';
		setTimeout(() => { if (elements.collaboratorStatus) elements.collaboratorStatus.textContent = ''; }, 2000);
		return;
	}
	
	// Création optimiste du nouveau collaborateur
	const newRow = {
		matricule: matricule,
		nomPrenom: nomPrenom,
		days: {},
		isSimpleRajout: false,
		isAddedCollaborator: true,
		imageBase64: '',
		rajouts: jours.reduce((acc, day) => { acc[day] = true; return acc; }, {})
	};
	DAY_OPTIONS.forEach(day => {
		newRow.days[day.key] = { planning: '', period: '', choice: '', attribution: '', rajout: jours.includes(day.key) ? 'X' : '', checking: '', heurePointage: '', isChecked: false };
	});
	state.rows.unshift(newRow);
	
	// Mise à jour des compteurs
	if (elements.newCollaboratorCount) {
		state.newCollaboratorCount++;
		elements.newCollaboratorCount.textContent = String(state.newCollaboratorCount);
	}
	if (elements.totalRows) {
		elements.totalRows.textContent = String(state.rows.length);
	}
	
	renderCollaboratorOptions();
	renderCurrentFormulaireSearch();
	elements.collaboratorForm.reset();
	setDefaultCollaboratorDays();
	elements.collaboratorStatus.textContent = '✅ Nouveau collaborateur ajouté !';
	setTimeout(() => { if (elements.collaboratorStatus) elements.collaboratorStatus.textContent = ''; }, 2000);
	
	const params = new URLSearchParams({ action: 'addCollaborator', matricule, nomPrenom, jours: jours.join(',') });
	loadJsonpSilent(`${WEB_APP_URL}?${params.toString()}`, 10000)
		.finally(() => silentRefresh());
}

// ==================== RAJOUT SIMPLE (OPTIMISTE) ====================
function onRajoutSubmit(event) {
	event.preventDefault();
	const matricule = normalizeText(state.currentSearchMatricule);
	const jours = (elements.rajoutJour?.value || state.selectedRajoutDays.join(',') || getTodayDayKey()).split(',').map(v => normalizeText(v)).filter(Boolean);
	
	if (!matricule || !jours.length) {
		elements.rajoutStatus.textContent = '❌ Faites d\'abord une recherche.';
		setTimeout(() => { if (elements.rajoutStatus) elements.rajoutStatus.textContent = ''; }, 2000);
		return;
	}
	
	const targetRow = state.rows.find(row => normalizeText(row.matricule) === matricule);
	if (!targetRow) {
		elements.rajoutStatus.textContent = '❌ Ce matricule n\'existe pas. Utilisez "Nouveau collaborateur".';
		setTimeout(() => { if (elements.rajoutStatus) elements.rajoutStatus.textContent = ''; }, 2000);
		return;
	}
	
	// Mise à jour optimiste
	if (!targetRow.rajouts) targetRow.rajouts = {};
	jours.forEach(jour => {
		targetRow.rajouts[jour] = true;
		if (targetRow.days && targetRow.days[jour]) targetRow.days[jour].rajout = 'X';
	});
	if (!targetRow.isSimpleRajout) {
		targetRow.isSimpleRajout = true;
		if (elements.simpleRajoutCount) {
			state.simpleRajoutCount++;
			elements.simpleRajoutCount.textContent = String(state.simpleRajoutCount);
		}
	}
	
	renderRajoutList();
	runCurrentSearch();
	resetRajoutFormState();
	setRajoutSubmittingState(false);
	elements.rajoutStatus.textContent = '✅ Rajout simple ajouté !';
	setTimeout(() => { if (elements.rajoutStatus) elements.rajoutStatus.textContent = ''; }, 2000);
	
	const params = new URLSearchParams({ action: 'rajoutAdd', matricule, date: elements.rajoutDate?.value || '', jours: jours.join(',') });
	loadJsonpSilent(`${WEB_APP_URL}?${params.toString()}`, 10000)
		.finally(() => silentRefresh());
}

// ==================== ATTRIBUTION (OPTIMISTE) ====================
function onAttributionSubmit(event) {
	event.preventDefault();
	const matricule = normalizeText(state.currentSearchMatricule);
	const attribution = elements.attributionTargetInput?.value.trim();
	const jours = (elements.attributionJour?.value || state.selectedAttributionDays.join(',') || '').split(',').map(v => normalizeText(v)).filter(Boolean);
	
	if (!matricule) { elements.attributionStatus.textContent = '❌ Sélectionnez un matricule source.'; setTimeout(() => { if (elements.attributionStatus) elements.attributionStatus.textContent = ''; }, 2000); return; }
	if (!attribution) { elements.attributionStatus.textContent = '❌ Entrez le matricule attributaire.'; setTimeout(() => { if (elements.attributionStatus) elements.attributionStatus.textContent = ''; }, 2000); return; }
	if (!jours.length) { elements.attributionStatus.textContent = '❌ Sélectionnez au moins un jour.'; setTimeout(() => { if (elements.attributionStatus) elements.attributionStatus.textContent = ''; }, 2000); return; }
	
	const targetExists = state.rows.some(row => normalizeText(row.matricule) === normalizeText(attribution));
	if (!targetExists) { elements.attributionStatus.textContent = `❌ "${attribution}" n'existe pas.`; setTimeout(() => { if (elements.attributionStatus) elements.attributionStatus.textContent = ''; }, 2000); return; }
	if (normalizeText(matricule) === normalizeText(attribution)) { elements.attributionStatus.textContent = '❌ Auto-attribution interdite.'; setTimeout(() => { if (elements.attributionStatus) elements.attributionStatus.textContent = ''; }, 2000); return; }
	
	// Mise à jour optimiste
	const targetRow = state.rows.find(row => normalizeText(row.matricule) === matricule);
	if (targetRow && targetRow.days) {
		jours.forEach(jour => {
			if (targetRow.days[jour]) targetRow.days[jour].attribution = attribution;
		});
	}
	
	runCurrentSearch();
	setAttributionSubmittingState(false);
	if (elements.attributionTargetInput) elements.attributionTargetInput.value = '';
	elements.attributionStatus.textContent = '✅ Attribution enregistrée !';
	setTimeout(() => { if (elements.attributionStatus) elements.attributionStatus.textContent = ''; }, 2000);
	
	const params = new URLSearchParams({ action: 'attributionAdd', matricule, attribution, jours: jours.join(',') });
	loadJsonpSilent(`${WEB_APP_URL}?${params.toString()}`, 10000)
		.finally(() => silentRefresh());
}

// ==================== CHARGEMENT SILENCIEUX ====================
function silentRefresh() {
	if (state.pendingSync) return;
	state.pendingSync = true;
	loadJsonpSilent(`${WEB_APP_URL}?format=json&includeImages=false`, 10000)
		.then((payload) => {
			if (payload) {
				const normalized = normalizePayload(payload);
				state.rows = normalized.rows;
				if (elements.totalRows) elements.totalRows.textContent = String(normalized.totalRows);
				if (elements.noPlanningCount) elements.noPlanningCount.textContent = String(normalized.noPlanningCount);
				if (elements.noChoiceCount) elements.noChoiceCount.textContent = String(normalized.noChoiceCount);
				if (elements.simpleRajoutCount) elements.simpleRajoutCount.textContent = String(normalized.simpleRajoutCount);
				if (elements.newCollaboratorCount) elements.newCollaboratorCount.textContent = String(normalized.newCollaboratorCount);
				renderCollaboratorOptions();
				updateDashboardMealCounts();
				
				const activePage = document.querySelector('.page-section.active')?.id;
				if (activePage === 'page-recherche' && state.currentSearchMatricule) runCurrentSearch();
				else if (activePage === 'page-formulaire') renderCurrentFormulaireSearch();
				else if (activePage === 'page-rajout') renderRajoutList();
				else if (activePage === 'page-stats') updateStatistics();
			}
		})
		.catch(() => {})
		.finally(() => { state.pendingSync = false; });
}

// ==================== RENDU DES RÉSULTATS ====================
function renderResults(rows, emptyMessage, isEmpty, mode, targetElement) {
	const container = targetElement || elements.searchResults;
	if (!container) return;
	if (isEmpty) { container.classList.add('empty-state'); container.innerHTML = emptyMessage; return; }
	container.classList.remove('empty-state');
	const isCompact = window.innerWidth <= 420;
	const abbrev = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim' };
	container.innerHTML = rows.map(row => {
		const rajoutDays = Object.keys(row.rajouts || {});
		const checkedCount = DAY_OPTIONS.filter(day => isDayChecked(row.days?.[day.key])).length;
		return `<article class="result-card result-card--search"><div class="result-topline"><div><h3>${escapeHtml(row.nomPrenom)}</h3><div><span class="result-badge">${escapeHtml(row.matricule)}</span>${checkedCount ? `<span class="result-state-pill is-checked">${checkedCount} repas pris</span>` : ''}</div></div></div><div class="week-grid">${DAY_OPTIONS.map(day => {
			const dayData = row.days?.[day.key] || {};
			const ready = isDayReady(dayData);
			const checked = isDayChecked(dayData);
			const dayIsRajout = Boolean(dayData?.rajout?.trim()) || rajoutDays.includes(day.key);
			const statusText = checked ? 'Repas pris' : dayIsRajout ? 'Rajouté' : ready ? 'Prêt' : 'Manquant';
			return `<div class="week-column ${dayIsRajout ? 'is-rajout' : (ready ? 'is-ready' : 'is-missing')} ${checked ? 'is-checked' : ''}"><div class="day-badge ${checked ? 'is-checked' : (dayIsRajout ? 'is-rajout' : (ready ? 'is-ready' : 'is-missing'))}">${escapeHtml(statusText)}</div><h4>${escapeHtml(isCompact ? abbrev[day.key] : day.label)}</h4>${renderWeekdayCell('Planning', dayData.planning, '---')}${renderWeekdayCell('Shift', dayData.period, '---')}${renderWeekdayCell('Choix', dayData.choice, '---')}${renderOptionalWeekdayCell('Attribué', dayData.attribution)}<div class="day-status ${checked ? 'is-checked' : (dayIsRajout ? 'is-rajout' : (ready ? 'is-ready' : 'is-missing'))}">${checked ? '✅ Pris' : (dayIsRajout ? '📋 Rajouté' : (ready ? '✅' : '❌'))}</div></div>`;
		}).join('')}</div></article>`;
	}).join('');
}

function renderWeekdayCell(label, value, fallback) {
	const text = String(value || '').trim() || fallback;
	return `<div class="week-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(text)}</strong></div>`;
}

function renderOptionalWeekdayCell(label, value) {
	const text = String(value || '').trim();
	return text ? `<div class="week-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(text)}</strong></div>` : '';
}

// ==================== FORMULAIRE FICHE ====================
function renderFormulaireResults(rows, emptyMessage, isEmpty, dayKey) {
	const container = elements.formulaireResults;
	if (!container) return;
	if (isEmpty) { container.classList.add('empty-state'); container.innerHTML = emptyMessage; return; }
	const todayKey = dayKey || getTodayDayKey();
	container.innerHTML = rows.map(row => {
		const dayData = row.days?.[todayKey] || {};
		const displayState = getFormulaireDisplayState(row, dayData, todayKey);
		const checked = isDayChecked(dayData);
		const imageSrc = getCollaboratorImageSrc(row);
		return `<div class="formulaire-result ${displayState.className} ${checked ? 'is-checked' : ''}"><div class="formulaire-result-layout--avatar"><div class="formulaire-result-avatar" style="${imageSrc ? `background-image:url('${imageSrc}')` : ''}"></div><div class="formulaire-result-main"><div class="formulaire-result-header"><div><div class="formulaire-result-name">${escapeHtml(row.nomPrenom)}</div><div class="formulaire-result-matricule">${escapeHtml(row.matricule)}</div></div>${displayState.badgeClass === 'is-rajout-added' ? '<div class="formulaire-result-rajout-badge">Rajouté</div>' : ''}${displayState.attributedTo ? `<div class="formulaire-result-attribute-badge">⚠️ Attribué à ${escapeHtml(displayState.attributedTo)}</div>` : ''}</div><div class="formulaire-result-grid formulaire-result-grid--planning"><div class="formulaire-result-item"><span>Shift</span><strong>${escapeHtml(dayData.period || '---')}</strong></div><div class="formulaire-result-item"><span>Planning</span><strong>${escapeHtml(isNonHourPlanningLabel(dayData.planning) ? '---' : (dayData.planning || '---'))}</strong></div><div class="formulaire-result-item"><span>Choix</span><strong>${escapeHtml(dayData.choice || '---')}</strong></div>${dayData.attribution ? `<div class="formulaire-result-item"><span>Attribué à</span><strong>${escapeHtml(dayData.attribution)}</strong></div>` : ''}${dayData.heurePointage ? `<div class="formulaire-result-item"><span>Heure</span><strong>${escapeHtml(dayData.heurePointage)}</strong></div>` : ''}<div class="formulaire-result-item formulaire-result-item--check"><span>Action</span>${displayState.showAction && !checked ? `<button class="formulaire-action-button" data-meal-action="take" data-meal-day="${todayKey}" data-meal-matricule="${row.matricule}">🍽️ Marquer repas pris</button>` : (checked ? '<strong>✅ Repas pris</strong>' : '<strong class="formulaire-no-action">❌ Non disponible</strong>')}</div></div>${displayState.note ? `<div class="formulaire-result-footnote">${escapeHtml(displayState.note)}</div>` : ''}</div></div></div>`;
	}).join('');
}

function renderCurrentFormulaireSearch() {
	const matricule = state.formulaireSearchMatricule?.trim();
	if (!matricule) { showFormulaireIdleState(); return; }
	const matches = state.rows.filter(row => normalizeText(row.matricule).includes(matricule) || normalizeText(row.nomPrenom).includes(matricule));
	if (!matches.length) { renderFormulaireResults([], `Aucun résultat pour "${escapeHtml(matricule)}"`, true); return; }
	renderFormulaireResults(matches, '', false);
}

// ==================== RAJOUT LIST ====================
function renderRajoutList() {
	if (!elements.rajoutList) return;
	const rowsWithRajout = (state.rows || []).filter(r => r.rajouts && Object.keys(r.rajouts).length > 0);
	if (!rowsWithRajout.length) {
		elements.rajoutList.innerHTML = '<div class="results-list empty-state">Aucun rajout enregistre.</div>';
		return;
	}
	
	const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
	const daysLabels = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim' };
	
	rowsWithRajout.sort((a, b) => (a.matricule || '').localeCompare(b.matricule || ''));
	const simpleRows = rowsWithRajout.filter(row => row.isSimpleRajout === true && row.isAddedCollaborator !== true);
	const newCollaboratorRows = rowsWithRajout.filter(row => row.isAddedCollaborator === true);
	
	const renderTable = (rows, title, description, type) => {
		if (!rows.length) return '';
		return `
			<div class="rajout-table-container ${type}">
				<div class="rajout-table-header">
					<div>
						<h3>${escapeHtml(title)}</h3>
						<p class="rajout-description">${escapeHtml(description)}</p>
					</div>
					<span class="rajout-count">${rows.length}</span>
				</div>
				<div class="rajout-table-wrapper">
					<table class="rajout-table">
						<thead><tr><th class="rajout-col-name">Collaborateur</th>${days.map(d => `<th class="rajout-col-day">${daysLabels[d]}</th>`).join('')}</tr></thead>
						<tbody>${rows.map(row => `<tr><td class="rajout-col-name"><div class="rajout-cell-name"><strong>${escapeHtml(row.nomPrenom)}</strong><span class="rajout-cell-matricule">${escapeHtml(row.matricule)}</span></div></td>${days.map(d => `<td class="rajout-col-day ${row.rajouts?.[d] ? 'has-rajout' : ''}">${row.rajouts?.[d] ? '✓' : ''}</td>`).join('')}</tr>`).join('')}</tbody>
					</table>
				</div>
			</div>
		`;
	};
	
	elements.rajoutList.innerHTML = renderTable(simpleRows, '📋 RAJOUT SIMPLE', 'Personne déjà dans la base - Planning ou choix manquant', 'simple') + renderTable(newCollaboratorRows, '🆕 NOUVEAU COLLABORATEUR', 'Ajouté manuellement - N\'existait pas dans la base', 'new');
}

// ==================== OPTIONS DES JOURS ====================
function renderRajoutDayOptions() {
	if (!elements.rajoutDayButtons) return;
	elements.rajoutDayButtons.innerHTML = DAY_OPTIONS.map(day => `<button type="button" class="rajout-day-button" data-day="${day.key}">${day.label}</button>`).join('');
	elements.rajoutDayButtons.querySelectorAll('.rajout-day-button').forEach(btn => btn.addEventListener('click', () => toggleRajoutDay(btn.dataset.day)));
}

function renderCollaboratorDayOptions() {
	if (!elements.collaboratorDayButtons) return;
	elements.collaboratorDayButtons.innerHTML = DAY_OPTIONS.map(day => `<button type="button" class="rajout-day-button collaborator-day-button" data-day="${day.key}">${day.label}</button>`).join('');
	elements.collaboratorDayButtons.querySelectorAll('.collaborator-day-button').forEach(btn => btn.addEventListener('click', () => toggleCollaboratorDay(btn.dataset.day)));
}

function renderAttributionDayOptions() {
	if (!elements.attributionDayButtons) return;
	elements.attributionDayButtons.innerHTML = DAY_OPTIONS.map(day => `<button type="button" class="rajout-day-button" data-day="${day.key}">${day.label}</button>`).join('');
	elements.attributionDayButtons.querySelectorAll('button[data-day]').forEach(btn => btn.addEventListener('click', () => toggleAttributionDay(btn.dataset.day)));
}

function setRajoutDays(dayKeys) {
	state.selectedRajoutDays = (dayKeys || []).filter(Boolean);
	if (elements.rajoutJour) elements.rajoutJour.value = state.selectedRajoutDays.join(',');
	if (elements.rajoutDayButtons) {
		elements.rajoutDayButtons.querySelectorAll('.rajout-day-button').forEach(btn => btn.classList.toggle('is-selected', state.selectedRajoutDays.includes(btn.dataset.day)));
	}
	saveUiState();
}

function setCollaboratorDays(dayKeys) {
	state.selectedCollaboratorDays = (dayKeys || []).filter(Boolean);
	if (elements.collaboratorDays) elements.collaboratorDays.value = state.selectedCollaboratorDays.join(',');
	if (elements.collaboratorDayButtons) {
		elements.collaboratorDayButtons.querySelectorAll('.collaborator-day-button').forEach(btn => btn.classList.toggle('is-selected', state.selectedCollaboratorDays.includes(btn.dataset.day)));
	}
	saveUiState();
}

function setAttributionDays(dayKeys) {
	state.selectedAttributionDays = (dayKeys || []).filter(Boolean);
	if (elements.attributionJour) elements.attributionJour.value = state.selectedAttributionDays.join(',');
	if (elements.attributionDayButtons) {
		elements.attributionDayButtons.querySelectorAll('button[data-day]').forEach(btn => {
			const isSelected = state.selectedAttributionDays.includes(btn.dataset.day);
			btn.classList.toggle('is-selected', isSelected);
		});
	}
}

function setDefaultRajoutDate() {
	if (!elements.rajoutDate) return;
	const today = new Date();
	const offset = today.getTimezoneOffset() * 60000;
	elements.rajoutDate.value = new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function setDefaultRajoutJour() {
	if (!elements.rajoutJour) return;
	const mapping = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
	setRajoutDays([mapping[new Date().getDay()] || 'lundi']);
}

function setDefaultAttributionJour() { setAttributionDays([getTodayDayKey() === 'dimanche' ? 'lundi' : getTodayDayKey()]); }

function setDefaultCollaboratorDays() { setCollaboratorDays([]); }

function toggleRajoutDay(dayKey) {
	if (!dayKey) return;
	const current = [...(state.selectedRajoutDays || [])];
	const index = current.indexOf(dayKey);
	if (index >= 0) current.splice(index, 1);
	else current.push(dayKey);
	setRajoutDays(current);
}

function toggleCollaboratorDay(dayKey) {
	if (!dayKey) return;
	const current = [...(state.selectedCollaboratorDays || [])];
	const index = current.indexOf(dayKey);
	if (index >= 0) current.splice(index, 1);
	else current.push(dayKey);
	setCollaboratorDays(current);
}

function toggleAttributionDay(dayKey) {
	if (!dayKey) return;
	const current = [...(state.selectedAttributionDays || [])];
	const index = current.indexOf(dayKey);
	if (index >= 0) current.splice(index, 1);
	else current.push(dayKey);
	setAttributionDays(current);
}

function setRajoutMatricule(matricule) {
	state.currentSearchMatricule = normalizeText(matricule);
	if (elements.rajoutMatriculeDisplay) elements.rajoutMatriculeDisplay.textContent = state.currentSearchMatricule ? state.currentSearchMatricule.toUpperCase() : 'Aucun matricule sélectionné';
	if (elements.attributionMatriculeDisplay) elements.attributionMatriculeDisplay.textContent = state.currentSearchMatricule ? state.currentSearchMatricule.toUpperCase() : 'Aucun matricule selectionne';
	saveUiState();
}

function renderCollaboratorOptions() {
	if (!elements.collaboratorOptions) return;
	const options = (state.rows || []).slice().sort((a, b) => (a.matricule || '').localeCompare(b.matricule || '')).map(row => `<option value="${escapeHtml(row.matricule)}">${escapeHtml(row.matricule + ' - ' + row.nomPrenom)}</option>`).join('');
	elements.collaboratorOptions.innerHTML = options;
}

// ==================== CHARGEMENT DES DONNÉES ====================
async function loadData() {
	try {
		const payload = await loadJsonp(`${WEB_APP_URL}?format=json&includeImages=false`, 30000);
		const normalized = normalizePayload(payload);
		state.rows = normalized.rows;
		if (elements.totalRows) elements.totalRows.textContent = String(normalized.totalRows);
		if (elements.noPlanningCount) elements.noPlanningCount.textContent = String(normalized.noPlanningCount);
		if (elements.noChoiceCount) elements.noChoiceCount.textContent = String(normalized.noChoiceCount);
		if (elements.simpleRajoutCount) elements.simpleRajoutCount.textContent = String(normalized.simpleRajoutCount);
		if (elements.newCollaboratorCount) elements.newCollaboratorCount.textContent = String(normalized.newCollaboratorCount);
		renderCollaboratorOptions();
		updateDashboardMealCounts();
		
		if (document.getElementById('page-recherche')?.classList.contains('active')) {
			if (state.currentSearchMatricule) runCurrentSearch();
			else showIdleState();
		} else if (document.getElementById('page-formulaire')?.classList.contains('active')) {
			renderCurrentFormulaireSearch();
		} else if (document.getElementById('page-rajout')?.classList.contains('active')) {
			renderRajoutList();
		} else if (document.getElementById('page-stats')?.classList.contains('active')) {
			updateStatistics();
		}
	} catch (error) {
		console.error('loadData error:', error);
	}
}

function loadJsonp(baseUrl, timeoutMs) {
	return new Promise((resolve, reject) => {
		const callbackName = `cantineJsonp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
		const src = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
		let timer = null;
		let completed = false;
		const script = document.createElement('script');
		function cleanup() { if (timer) clearTimeout(timer); if (window[callbackName]) delete window[callbackName]; if (script.parentNode) script.parentNode.removeChild(script); }
		window[callbackName] = (data) => { if (completed) return; completed = true; cleanup(); resolve(data); };
		script.onerror = () => { if (completed) return; completed = true; cleanup(); reject(new Error('Erreur de chargement')); };
		timer = setTimeout(() => { if (completed) return; completed = true; cleanup(); reject(new Error('Timeout')); }, timeoutMs || 30000);
		script.src = src;
		script.async = true;
		document.head.appendChild(script);
	});
}

function loadJsonpSilent(baseUrl, timeoutMs) {
	return new Promise((resolve) => {
		const callbackName = `cantineJsonp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
		const src = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
		let timer = null;
		let completed = false;
		const script = document.createElement('script');
		function cleanup() { if (timer) clearTimeout(timer); if (window[callbackName]) delete window[callbackName]; if (script.parentNode) script.parentNode.removeChild(script); }
		window[callbackName] = (data) => { if (completed) return; completed = true; cleanup(); resolve(data); };
		script.onerror = () => { if (completed) return; completed = true; cleanup(); resolve(null); };
		timer = setTimeout(() => { if (completed) return; completed = true; cleanup(); resolve(null); }, timeoutMs || 10000);
		script.src = src;
		script.async = true;
		document.head.appendChild(script);
	});
}

// ==================== NORMALISATION ====================
function normalizePayload(payload) {
	if (payload?.rows) {
		const summary = computeSummary(payload.rows);
		return { rows: payload.rows, totalRows: payload.totalRows || payload.rows.length, noPlanningCount: payload.noPlanningCount ?? summary.noPlanningCount, noChoiceCount: payload.noChoiceCount ?? summary.noChoiceCount, simpleRajoutCount: payload.simpleRajoutCount ?? summary.simpleRajoutCount, newCollaboratorCount: payload.newCollaboratorCount ?? summary.newCollaboratorCount, days: payload.days?.length ? payload.days : DAY_OPTIONS };
	}
	if (payload?.values) {
		const rows = fromRawValues(payload.values);
		const summary = computeSummary(rows);
		return { rows, totalRows: rows.length, noPlanningCount: summary.noPlanningCount, noChoiceCount: summary.noChoiceCount, simpleRajoutCount: summary.simpleRajoutCount, newCollaboratorCount: summary.newCollaboratorCount, days: DAY_OPTIONS };
	}
	throw new Error('Format JSON non reconnu.');
}

function fromRawValues(values) {
	if (!values?.length) return [];
	return values.slice(1).filter(row => row.some(cell => String(cell || '').trim())).map(row => ({
		matricule: row[0] || '',
		nomPrenom: row[1] || '',
		days: DAY_OPTIONS.reduce((acc, day) => {
			const idx = DAY_COLUMN_MAP[day.key];
			const checking = row[idx.checking] || '';
			acc[day.key] = { planning: row[idx.planning] || '', period: row[idx.period] || '', choice: row[idx.choice] || '', attribution: idx.attribution == null ? '' : (row[idx.attribution] || ''), rajout: row[idx.rajout] || '', checking, heurePointage: row[idx.heurePointage] || '', isChecked: normalizeText(checking) === 'x' };
			return acc;
		}, {}),
		isSimpleRajout: normalizeText(row[SIMPLE_RAJOUT_COLUMN_INDEX]) === 'x',
		isAddedCollaborator: normalizeText(row[NEW_COLLABORATOR_COLUMN_INDEX]) === 'x',
		imageBase64: row[PHOTO_COLUMN_INDEX] || '',
		rajouts: DAY_OPTIONS.reduce((acc, day) => { if (String(row[DAY_COLUMN_MAP[day.key]?.rajout] || '').trim().toUpperCase() === 'X') acc[day.key] = true; return acc; }, {}),
	}));
}

function computeSummary(rows) {
	let noPlanning = 0, noChoice = 0, simpleRajout = 0, newCollaborator = 0;
	rows.forEach(row => {
		if (!DAY_OPTIONS.some(day => hasMeaningfulPlanning(row.days?.[day.key]?.planning))) noPlanning++;
		if (!DAY_OPTIONS.some(day => String(row.days?.[day.key]?.choice || '').trim())) noChoice++;
		if (row.isSimpleRajout) simpleRajout++;
		if (row.isAddedCollaborator) newCollaborator++;
	});
	return { noPlanningCount: noPlanning, noChoiceCount: noChoice, simpleRajoutCount: simpleRajout, newCollaboratorCount: newCollaborator };
}

// ==================== STATISTIQUES ====================
function extractHour(timeStr) {
	if (!timeStr) return null;
	const match = String(timeStr).match(/(\d{1,2}):/);
	if (match) {
		const hour = parseInt(match[1], 10);
		return isNaN(hour) ? null : hour;
	}
	return null;
}

function getTimeRange(hour) {
	if (hour === null) return 'all';
	// Map hours into the new 1-hour buckets requested by the user
	if (hour >= 10 && hour < 11) return '10-11';
	if (hour >= 11 && hour < 12) return '11-12';
	if (hour >= 12 && hour < 13) return '12-13';
	if (hour >= 13 && hour < 14) return '13-14';
	if (hour >= 14 && hour < 15) return '14-15';
	if (hour >= 15) return '15+';
	return 'all';
}

function calculateStats(selectedDay, selectedRange) {
	const rows = state.rows || [];
	const targetDay = selectedDay || getTodayDayKey();
	
	let eligibleCount = 0;
	let takenCount = 0;
	let notTakenCount = 0;
	let attributionCount = 0;
	let rajoutCount = 0;
	
	const rangeCounts = {};
	for (const key in TIME_RANGES) {
		rangeCounts[key] = 0;
	}
	
	rows.forEach(row => {
		const dayData = row.days?.[targetDay];
		if (!dayData) return;
		
		const isRajout = Boolean(dayData.rajout?.trim()) || row.isAddedCollaborator;
		const hasValidPlanning = hasMeaningfulPlanning(dayData.planning) && isHourPlanningValue(dayData.planning);
		const hasValidChoice = dayData.choice && !isMissingPlaceholder(dayData.choice, ['pas de choix', 'aucun choix', 'choix', 'absent']);
		const isTaken = isDayChecked(dayData);
		const isEligible = isTaken || isRajout || (hasValidPlanning && hasValidChoice);
		
		if (!isEligible) return;
		
		eligibleCount++;
		
		const hasAttribution = Boolean(String(dayData.attribution || '').trim());
		const hasRajout = Boolean(String(dayData.rajout || '').trim());
		
		if (hasAttribution) attributionCount++;
		if (hasRajout) rajoutCount++;

		if (isTaken) {
			takenCount++;
			const hour = extractHour(dayData.heurePointage);
			const range = getTimeRange(hour);
			rangeCounts[range]++;
		} else {
			notTakenCount++;
		}
	});
	
	return { total: eligibleCount, taken: takenCount, notTaken: notTakenCount, rangeCounts, attributionCount, rajoutCount };
}

function renderHistogram(rangeCounts, totalTaken, selectedRange) {
	const ctx = document.getElementById('mealsHistogram');
	if (!ctx) return;
	
	const canvas = ctx.getContext('2d');
	let rangesToShow = [];
	
	if (selectedRange === 'all') {
		rangesToShow = ['10-11', '11-12', '12-13', '13-14', '14-15', '15+'];
	} else {
		rangesToShow = [selectedRange];
	}
	
	const labels = [];
	const data = [];
	const backgroundColors = [];
	
	rangesToShow.forEach(rangeKey => {
		if (rangeKey === 'all') return;
		labels.push(TIME_RANGES[rangeKey].label);
		data.push(rangeCounts[rangeKey] || 0);
		backgroundColors.push(TIME_RANGES[rangeKey].color || 'rgba(31, 122, 90, 0.7)');
	});
	
	if (statsChart) {
		statsChart.destroy();
	}
	
	if (data.every(v => v === 0)) {
		canvas.parentElement.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">📊 Aucune donnée disponible pour cette période</div>';
		return;
	}
	
	statsChart = new Chart(canvas, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Nombre de repas pris',
				data: data,
				backgroundColor: backgroundColors,
				borderColor: backgroundColors,
				borderWidth: 1,
				borderRadius: 8,
				barPercentage: 0.6,
				categoryPercentage: 0.7
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: { callbacks: { label: function(context) { return `🍽️ ${context.raw} repas`; } } }
			},
			scales: {
				y: { beginAtZero: true, title: { display: true, text: 'Nombre de repas', font: { weight: 'bold', size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } },
				x: { title: { display: true, text: 'Plages horaires', font: { weight: 'bold', size: 12 } }, grid: { display: false } }
			},
			animation: { duration: 500, easing: 'easeOutQuart' }
		}
	});

	// Build a small custom legend matching each bar color and label
	try {
		const legendContainer = document.getElementById('histogramLegend');
		if (legendContainer) {
			legendContainer.innerHTML = labels.map((lbl, i) => {
				const count = data[i] || 0;
				const color = backgroundColors[i] || '#ccc';
				return `<div class="histogram-legend-item"><span class="histogram-legend-color" style="background:${color}"></span><span class="histogram-legend-text">${lbl}</span><span class="histogram-legend-value">${count} repas</span></div>`;
			}).join('');
		}
	} catch (e) {}
}

function renderPieChart(taken, notTaken) {
	const ctx = document.getElementById('mealsPieChart');
	if (!ctx) return;

	const canvasCtx = ctx.getContext('2d');
	const labels = ['Repas pris', 'Repas non pris'];
	const values = [taken, notTaken];
	const colors = ['#10b981', '#f59e0b'];

	if (pieChart) {
		pieChart.destroy();
	}

	pieChart = new Chart(canvasCtx, {
		type: 'doughnut',
		data: {
			labels: labels,
			datasets: [{
				data: values,
				backgroundColor: colors,
				borderColor: '#ffffff',
				borderWidth: 2,
				cutout: '60%'
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: { callbacks: { label: function(context) { return `${context.label}: ${context.raw} repas`; } } }
			}
		}
	});

	const legendContainer = document.getElementById('statsPieLegend');
	if (legendContainer) {
		legendContainer.innerHTML = [
			{ label: 'Repas pris', value: taken, color: colors[0] },
			{ label: 'Repas non pris', value: notTaken, color: colors[1] }
		].map(item => `
			<div class="stats-pie-legend-item">
				<span class="stats-pie-legend-color" style="background:${item.color}"></span>
				<span class="stats-pie-legend-label">${item.label}</span>
				<span class="stats-pie-legend-meta">${item.value} repas</span>
			</div>
		`).join('');
	}
}

function updateStatistics() {
	const selectedDay = elements.statsDayFilter?.value || getTodayDayKey();
	const selectedRange = elements.statsTimeRangeFilter?.value || 'all';
	const stats = calculateStats(selectedDay, selectedRange);
	
	if (elements.statsTotalMeals) elements.statsTotalMeals.textContent = stats.total;
	if (elements.statsTakenMeals) elements.statsTakenMeals.textContent = stats.taken;
	if (elements.statsNotTakenMeals) elements.statsNotTakenMeals.textContent = stats.notTaken;
	if (elements.statsAttributionCount) elements.statsAttributionCount.textContent = stats.attributionCount;
	if (elements.statsRajoutCount) elements.statsRajoutCount.textContent = stats.rajoutCount;
	
	let filteredRangeCounts = { ...stats.rangeCounts };
	if (selectedRange !== 'all') {
		for (const key in filteredRangeCounts) {
			if (key !== selectedRange && key !== 'all') {
				filteredRangeCounts[key] = 0;
			}
		}
	}
	
	renderHistogram(filteredRangeCounts, stats.taken, selectedRange);
	renderPieChart(stats.taken, stats.notTaken);

	// Update human-readable day labels in the summary cards
	try {
		const dayLabel = getDayLabel(selectedDay || getTodayDayKey());
		const lblEl = document.getElementById('statsDayLabel');
		const lblEl2 = document.getElementById('statsDayLabel2');
		if (lblEl) lblEl.textContent = dayLabel;
		if (lblEl2) lblEl2.textContent = dayLabel;
	} catch (e) {}
}

// ==================== EXPORT ====================
function onExportClick() {
	const day = elements.exportDay?.value;
	if (!day) { if (elements.exportStatus) elements.exportStatus.textContent = 'Sélectionnez un jour.'; return; }
	try {
		const data = [['Matricule', 'NomPrenom', 'Jour', 'Choix', 'Rajout', 'Attribution', 'Checking', 'HeurePointage']];
		state.rows.forEach(row => {
			DAY_OPTIONS.forEach(dayOpt => {
				if (day !== 'all' && dayOpt.key !== day) return;
				const d = row.days?.[dayOpt.key] || {};
				const isRajoutX = Boolean(row.rajouts?.[dayOpt.key]) || normalizeText(d.rajout) === 'x' || String(d.rajout || '').trim().toLowerCase() === 'x';
				const checkingOk = normalizeText(d.checking) === 'x';
				data.push([
					row.matricule || '',
					row.nomPrenom || '',
					dayOpt.label,
					d.choice || '',
					isRajoutX ? 'Ok' : 'No',
					d.attribution || '',
					checkingOk ? 'Ok' : 'No',
					d.heurePointage || ''
				]);
			});
		});
		const ws = XLSX.utils.aoa_to_sheet(data);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Données');
		XLSX.writeFile(wb, `cantine-export-${day === 'all' ? 'tous' : day}.xlsx`);
		if (elements.exportStatus) elements.exportStatus.textContent = '✅ Export réussi';
		setTimeout(() => { if (elements.exportStatus?.textContent === '✅ Export réussi') elements.exportStatus.textContent = ''; }, 3000);
	} catch(e) { if (elements.exportStatus) elements.exportStatus.textContent = `❌ Erreur: ${e.message}`; }
}

// ==================== UI STATES ====================
function resetSearch() {
	if (elements.matriculeInput) elements.matriculeInput.value = '';
	setRajoutMatricule('');
	setRajoutDays([]);
	localStorage.removeItem('cantine.lastSearchMatricule');
	localStorage.removeItem('cantine.rajoutDays');
	showIdleState();
	elements.resultsHint.textContent = 'Aucun filtre appliqué.';
	if (elements.searchResults) { elements.searchResults.classList.add('empty-state'); elements.searchResults.textContent = 'Lancez une recherche pour afficher les résultats.'; }
}

function resetFormulaireSearch() {
	state.formulaireSearchMatricule = '';
	if (elements.formulaireMatriculeInput) elements.formulaireMatriculeInput.value = '';
	localStorage.removeItem('cantine.formulaireMatricule');
	showFormulaireIdleState();
}

function showFormulaireIdleState() {
	if (elements.formulaireResults) { elements.formulaireResults.classList.add('empty-state'); elements.formulaireResults.textContent = 'Lancez une recherche pour voir la fiche collaborateur.'; }
}

function showIdleState() {
	if (elements.searchResults) { elements.searchResults.classList.add('empty-state'); elements.searchResults.textContent = 'Lancez une recherche pour afficher les résultats.'; }
}

// ==================== STORAGE ====================
function saveUiState() {
	try {
		localStorage.setItem('cantine.lastSearchMatricule', state.currentSearchMatricule || '');
		localStorage.setItem('cantine.rajoutDays', JSON.stringify(state.selectedRajoutDays || []));
		localStorage.setItem('cantine.collaboratorDays', JSON.stringify(state.selectedCollaboratorDays || []));
		localStorage.setItem('cantine.formulaireMatricule', state.formulaireSearchMatricule || '');
	} catch(e) {}
}

function loadUiState() {
	try {
		const last = localStorage.getItem('cantine.lastSearchMatricule') || '';
		if (last && elements.matriculeInput) { elements.matriculeInput.value = last; state.currentSearchMatricule = last; }
		const rajoutDays = JSON.parse(localStorage.getItem('cantine.rajoutDays') || '[]');
		if (rajoutDays.length) setRajoutDays(rajoutDays);
		const collDays = JSON.parse(localStorage.getItem('cantine.collaboratorDays') || '[]');
		if (collDays.length) setCollaboratorDays(collDays);
		const f = localStorage.getItem('cantine.formulaireMatricule') || '';
		if (f && elements.formulaireMatriculeInput) { elements.formulaireMatriculeInput.value = f; state.formulaireSearchMatricule = f; }
	} catch(e) {}
}

// ==================== HERO SLIDESHOW ====================
function createSlideshow(containerId, slides, interval = 4000) {
	const frame = document.getElementById(containerId);
	if (!frame || !slides?.length) return null;
	frame.innerHTML = slides.map((s, i) => `<img class="hero-slide${i === 0 ? ' is-active' : ''}" src="${s.src}" alt="${s.alt}" loading="${i === 0 ? 'eager' : 'lazy'}">`).join('');
	const slideshow = { frame, slides: frame.querySelectorAll('.hero-slide'), index: 0, timer: null };
	if (slides.length > 1) slideshow.timer = setInterval(() => { slideshow.index = (slideshow.index + 1) % slides.length; slideshow.slides.forEach((s, i) => { s.classList.toggle('is-active', i === slideshow.index); s.setAttribute('aria-hidden', String(i !== slideshow.index)); }); }, interval);
	return slideshow;
}

function initializeHeroSlideshow() {
	createSlideshow('slideshow-left', HERO_SLIDES_LEFT, 3800);
	createSlideshow('slideshow-center', HERO_SLIDES_RIZ, 4200);
	createSlideshow('slideshow-right', HERO_SLIDES_DESSERTS, 3600);
}

function setHeroSlideshowPlaying(shouldPlay) { return shouldPlay; }

// ==================== UTILITAIRES GLOBAUX ====================
function normalizeText(value) {
	return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function escapeHtml(str) { return String(str || '').replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }
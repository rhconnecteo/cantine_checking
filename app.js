const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyHNaApWpdRuPLcMYnx5-Nbug3PK9d4AEnjFHZf_VODAVsvTFtF1I-wS8FS-msJx2nY/exec';

const DAY_OPTIONS = [
	{ key: 'lundi', label: 'Lundi' },
	{ key: 'mardi', label: 'Mardi' },
	{ key: 'mercredi', label: 'Mercredi' },
	{ key: 'jeudi', label: 'Jeudi' },
	{ key: 'vendredi', label: 'Vendredi' },
	{ key: 'samedi', label: 'Samedi' },
	{ key: 'dimanche', label: 'Dimanche' },
];

const HERO_SLIDES = [
	{ src: './image/food.jpg', alt: 'Assortiment de plats et aliments frais' },
	{ src: './image/food1.png', alt: 'Plat de cantine présenté en image' },
	{ src: './image/Food2.jpg', alt: 'Service de repas en restauration collective' },
	{ src: './image/Food4.jpg', alt: 'Préparation d’un plat savoureux' },
	{ src: './image/plat.jpg', alt: 'Plat servi à la cantine' },
	{ src: './image/plat1.jpg', alt: 'Autre plat de cantine' },
];

// Grouped slides for the three columns: left (all images), center (riz/plat), right (desserts)
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
	currentSearchMatricule: '',
	formulaireSearchMatricule: '',
	searchPeriodMode: 'all',
	overviewHtml: '',
	heroSlideshow: null,
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
	elements.totalRows = document.getElementById('totalRows');
	elements.matchedRows = document.getElementById('matchedRows');
	elements.noPlanningCount = document.getElementById('noPlanningCount');
	elements.noChoiceCount = document.getElementById('noChoiceCount');
	elements.rajoutCount = document.getElementById('rajoutCount');
	elements.searchForm = document.getElementById('searchForm');
	elements.matriculeInput = document.getElementById('matriculeInput');
	elements.formulaireSearchForm = document.getElementById('formulaireSearchForm');
	elements.formulaireMatriculeInput = document.getElementById('formulaireMatriculeInput');
	elements.collaboratorForm = document.getElementById('collaboratorForm');
	elements.collaboratorMatriculeInput = document.getElementById('collaboratorMatriculeInput');
	elements.collaboratorNameInput = document.getElementById('collaboratorNameInput');
	elements.collaboratorStatus = document.getElementById('collaboratorStatus');
	elements.searchPeriodMode = document.getElementById('searchPeriodMode');
	elements.resetButton = document.getElementById('resetButton');
	elements.formulaireResetButton = document.getElementById('formulaireResetButton');
	elements.rajoutForm = document.getElementById('rajoutForm');
	elements.rajoutMatriculeDisplay = document.getElementById('rajoutMatriculeDisplay');
	elements.rajoutDate = document.getElementById('rajoutDate');
	elements.rajoutJour = document.getElementById('rajoutJour');
	elements.rajoutDayButtons = document.getElementById('rajoutDayButtons');
	elements.rajoutStatus = document.getElementById('rajoutStatus');
	elements.rajoutSubmitButton = elements.rajoutForm ? elements.rajoutForm.querySelector('button[type="submit"]') : null;
	elements.resultsHint = document.getElementById('resultsHint');
	elements.searchResults = document.getElementById('searchResults');
	elements.formulaireResults = document.getElementById('formulaireResults');
	elements.searchRajoutZone = document.getElementById('searchRajoutZone');
	elements.rajoutHeroZone = document.getElementById('rajoutHeroZone');
	elements.navFormulaireButton = document.getElementById('navFormulaireButton');
	elements.navRechercheButton = document.getElementById('navRechercheButton');
	elements.navRajoutButton = document.getElementById('navRajoutButton');
	elements.rajoutList = document.getElementById('rajoutList');

		// Page-aware initialisation: only run features present on the current page
		if (elements.rajoutDate) {
			setDefaultRajoutDate();
		}
		if (elements.rajoutJour) {
			renderRajoutDayOptions();
			setDefaultRajoutJour();
		}
		bindEvents();
		adjustSidebarRajoutVisibility();
		showSection('page-recherche');
		setActiveNav(elements.navRechercheButton);
		// ensure the rajout form is positioned into the search sidebar by default
		positionRajoutForm('page-recherche');
		initializeHeroSlideshow();
		loadData();
});

function adjustSidebarRajoutVisibility(pageId) {
	const wrapper = document.getElementById('sidebarRajoutMetric');
 	if (!wrapper) return;
	wrapper.style.display = '';
}

function adjustRajoutSectionVisibility(pageId) {
	const section = document.getElementById('page-rajout');
	if (!section) return;
	const isRajoutPage = pageId ? pageId === 'page-rajout' : document.body.classList.contains('page-rajout-active');
	section.style.display = isRajoutPage ? '' : 'none';
}

function ensureSidebarRajoutContainer() {
	if (!elements.searchRajoutZone) return null;
	return elements.searchRajoutZone;
}

function positionRajoutForm(pageId) {
	if (!elements.rajoutForm) return;
	const isRajoutPage = pageId === 'page-recherche';
	const sidebarContainer = ensureSidebarRajoutContainer();
	if (sidebarContainer) {
		sidebarContainer.style.display = isRajoutPage ? '' : 'none';
	}
}

function setRajoutSubmittingState(isSubmitting) {
	if (!elements.rajoutSubmitButton) return;
	if (!elements.rajoutSubmitButton.dataset.originalLabel) {
		elements.rajoutSubmitButton.dataset.originalLabel = elements.rajoutSubmitButton.textContent || 'Rajout';
	}
	elements.rajoutSubmitButton.disabled = isSubmitting;
	elements.rajoutSubmitButton.textContent = isSubmitting ? 'Enregistrement...' : elements.rajoutSubmitButton.dataset.originalLabel;
}

function resetRajoutFormState() {
	if (elements.rajoutForm) {
		elements.rajoutForm.reset();
	}
	if (elements.rajoutDate) {
		elements.rajoutDate.value = '';
	}
	setRajoutDays([]);
	setRajoutMatricule('');
	state.currentSearchMatricule = '';
	if (elements.rajoutStatus) {
		elements.rajoutStatus.textContent = 'Formulaire vide.';
	}
	setRajoutSubmittingState(false);
}

function bindEvents() {
	if (elements.searchForm) {
		elements.searchForm.addEventListener('submit', onSearch);
	}

	if (elements.formulaireSearchForm) {
		elements.formulaireSearchForm.addEventListener('submit', onFormulaireSearch);
	}

	if (elements.collaboratorForm) {
		elements.collaboratorForm.addEventListener('submit', onCollaboratorSubmit);
	}

	if (elements.resetButton) {
		elements.resetButton.addEventListener('click', resetSearch);
	}

	if (elements.formulaireResetButton) {
		elements.formulaireResetButton.addEventListener('click', resetFormulaireSearch);
	}

	if (elements.searchResults) {
		elements.searchResults.addEventListener('click', onSearchResultsClick);
	}

	if (elements.formulaireResults) {
		elements.formulaireResults.addEventListener('change', onFormulaireMealToggle);
	}

	if (elements.rajoutForm) {
		elements.rajoutForm.addEventListener('submit', onRajoutSubmit);
	}

	bindNavButton(elements.navFormulaireButton, 'page-formulaire');
	bindNavButton(elements.navRechercheButton, 'page-recherche');
	bindNavButton(elements.navRajoutButton, 'page-rajout');

	if (elements.navRajoutButton) {
		elements.navRajoutButton.addEventListener('click', (ev) => {
			ev.preventDefault();
			showSection('page-rajout');
			setActiveNav(elements.navRajoutButton);
			renderRajoutList();
		});
	}

	if (elements.matriculeInput) {
		elements.matriculeInput.addEventListener('input', () => {
			if (!elements.matriculeInput.value.trim()) {
				showIdleState();
			}
		});
	}
}

function bindNavButton(button, sectionId) {
	if (!button) {
		return;
	}

	button.addEventListener('click', () => {
		showSection(sectionId);
		setActiveNav(button);
	});

}

function showSection(pageId) {
	const pages = ['page-formulaire', 'page-recherche', 'page-rajout'];
	pages.forEach((id) => {
		const el = document.getElementById(id);
		if (!el) return;
		if (id === pageId) el.classList.add('active');
		else el.classList.remove('active');
	});

	// Add a body-level class to allow page-specific styling (hide stats on rajout page)
	if (pageId === 'page-rajout') {
		document.body.classList.add('page-rajout-active');
		adjustRajoutSectionVisibility('page-rajout');
		positionRajoutForm('page-rajout');
		setHeroSlideshowPlaying(false);
		renderRajoutList();
		adjustSidebarRajoutVisibility('page-rajout');
	} else if (pageId === 'page-recherche') {
		document.body.classList.remove('page-rajout-active');
		adjustRajoutSectionVisibility('page-recherche');
		positionRajoutForm('page-recherche');
		adjustSidebarRajoutVisibility('page-recherche');
		setHeroSlideshowPlaying(true);
		if (state.currentSearchMatricule) {
			runCurrentSearch();
		} else {
			showIdleState();
		}
	} else {
		document.body.classList.remove('page-rajout-active');
		adjustRajoutSectionVisibility('page-formulaire');
		positionRajoutForm('page-formulaire');
		adjustSidebarRajoutVisibility('page-formulaire');
		setHeroSlideshowPlaying(true);
		renderCurrentFormulaireSearch();
	}

	// scroll to top of main card
	const top = document.getElementById('topSection');
	if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getTodayDayKey() {
	const mapping = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
	return mapping[new Date().getDay()] || 'lundi';
}

function getDayLabel(dayKey) {
	const day = DAY_OPTIONS.find((item) => item.key === dayKey);
	return day ? day.label : dayKey;
}

function isDayVisibleForMode(dayPeriod, mode) {
	const normalizedMode = normalizeText(mode);
	if (normalizedMode === 'all' || !normalizedMode) {
		return true;
	}
	return normalizeText(dayPeriod) === normalizedMode;
}

function isDayReady(dayData) {
	return Boolean(String(dayData?.planning || '').trim()) && Boolean(String(dayData?.choice || '').trim());
}

function isDayChecked(dayData) {
	return normalizeText(dayData?.checking) === 'x' || String(dayData?.isChecked || '').toLowerCase() === 'true';
}

function isCollaboratorAdded(row) {
	return Boolean(row?.isAddedCollaborator) || normalizeText(row?.source) === 'ajout_form';
}

function getFormulaireDisplayState(row, dayData) {
	const hasPlanning = Boolean(String(dayData?.planning || '').trim());
	const hasChoice = Boolean(String(dayData?.choice || '').trim());
	const isAdded = isCollaboratorAdded(row);

	if (isAdded) {
		return {
			className: 'is-added',
			label: 'Rajouté',
			note: 'Collaborateur ajouté via le formulaire.',
			showAction: true,
		};
	}

	if (hasPlanning && hasChoice) {
		return {
			className: 'is-green',
			label: 'Compatible',
			note: 'Planning et choix présents.',
			showAction: true,
		};
	}

	if (!hasPlanning && hasChoice) {
		return {
			className: 'is-orange',
			label: 'Planning manquant',
			note: 'Planning absent.',
			showAction: true,
		};
	}

	if (hasPlanning && !hasChoice) {
		return {
			className: 'is-red',
			label: 'Choix manquant',
			note: 'Choix absent.',
			showAction: true,
		};
	}

	return {
		className: 'is-empty',
		label: 'Aucune donnée',
		note: 'Pas de planning, pas de choix, pas de rajout.',
		showAction: false,
	};
}

function runCurrentSearch() {
	const searchValue = String(elements.matriculeInput && elements.matriculeInput.value || '').trim();
	const matricule = normalizeText(searchValue);
	const todayKey = getTodayDayKey();

	if (!matricule) {
		showIdleState();
		return;
	}

	const matches = state.rows.filter((row) => normalizeText(row.matricule) === matricule);
	state.lastResults = matches;
	setRajoutMatricule(matricule);

	if (matches.length > 0) {
		const existingRajoutDays = Object.keys(matches[0].rajouts || {});
		setRajoutDays(existingRajoutDays);
	} else {
		setRajoutDays([]);
	}

	elements.matchedRows.textContent = String(matches.length);

	if (!matches.length) {
		elements.resultsHint.textContent = 'Aucun matricule correspondant.';
		renderResults([], `Aucun resultat pour "${escapeHtml(searchValue)}".`, true, 'all', elements.searchResults);
		return;
	}

	elements.resultsHint.textContent = `Recherche pour ${searchValue || matricule.toUpperCase()} - ${getDayLabel(todayKey)}.`;
	renderResults(matches, '', false, 'all', elements.searchResults);
	scrollToSection('topSection');
}

function onFormulaireSearch(event) {
	event.preventDefault();
	const searchValue = String(elements.formulaireMatriculeInput && elements.formulaireMatriculeInput.value || '').trim();
	state.formulaireSearchMatricule = normalizeText(searchValue);
	if (!state.formulaireSearchMatricule) {
		showFormulaireIdleState();
		return;
	}
	renderCurrentFormulaireSearch();
	scrollToSection('topSection');
}

function onFormulaireMealToggle(event) {
	const input = event.target && event.target.closest ? event.target.closest('input[data-meal-action="take"]') : null;
	if (!input) return;

	const matricule = String(input.getAttribute('data-meal-matricule') || '').trim();
	const dayKey = String(input.getAttribute('data-meal-day') || '').trim();
	if (!matricule || !dayKey) return;
	if (!input.checked) return;

	input.disabled = true;
	const resultBlock = input.closest('.formulaire-result');
	const note = resultBlock ? resultBlock.querySelector('.formulaire-result-note') : null;
	if (note) note.textContent = 'Enregistrement...';

	const params = new URLSearchParams({
		action: 'markMealTaken',
		matricule,
		day: dayKey,
	});

	loadJsonp(`${WEB_APP_URL}?${params.toString()}`, 15000)
		.then((payload) => {
			if (!payload || payload.success === false) {
				throw new Error((payload && payload.message) || 'Erreur lors de la prise du repas.');
			}

			if (note) {
				note.textContent = payload.alreadyTaken ? 'Ce repas est deja pris.' : 'Repas marque comme pris.';
			}
			return loadData();
		})
		.then(() => {
			renderCurrentFormulaireSearch();
		})
		.catch((error) => {
			if (note) {
				note.textContent = error && error.message ? error.message : 'Impossible de marquer le repas.';
			}
			input.disabled = false;
			input.checked = false;
			renderCurrentFormulaireSearch();
		});
}

function onCollaboratorSubmit(event) {
	event.preventDefault();

	const matricule = String(elements.collaboratorMatriculeInput && elements.collaboratorMatriculeInput.value || '').trim();
	const nomPrenom = String(elements.collaboratorNameInput && elements.collaboratorNameInput.value || '').trim();

	if (!matricule || !nomPrenom) {
		if (elements.collaboratorStatus) {
			elements.collaboratorStatus.textContent = 'Le matricule et le nom sont obligatoires.';
		}
		return;
	}

	if (elements.collaboratorStatus) {
		elements.collaboratorStatus.textContent = 'Enregistrement...';
	}

	const params = new URLSearchParams({
		action: 'addCollaborator',
		matricule,
		nomPrenom,
	});

	loadJsonp(`${WEB_APP_URL}?${params.toString()}`, 15000)
		.then((payload) => {
			if (!payload || payload.success === false) {
				throw new Error((payload && payload.message) || 'Erreur lors de l\'ajout du collaborateur.');
			}

			if (elements.collaboratorStatus) {
				elements.collaboratorStatus.textContent = payload.message || 'Collaborateur ajouté.';
			}

			if (elements.collaboratorForm) {
				elements.collaboratorForm.reset();
			}

			state.formulaireSearchMatricule = normalizeText(matricule);
			if (elements.formulaireMatriculeInput) {
				elements.formulaireMatriculeInput.value = matricule;
			}

			return loadData();
		})
		.then(() => {
			renderCurrentFormulaireSearch();
		})
		.catch((error) => {
			if (elements.collaboratorStatus) {
				elements.collaboratorStatus.textContent = error && error.message ? error.message : 'Impossible d\'ajouter le collaborateur.';
			}
		});
}

function onSearchResultsClick(event) {
	const button = event.target && event.target.closest ? event.target.closest('button[data-meal-action="take"]') : null;
	if (!button) return;

	const container = event.currentTarget;

	const matricule = String(button.getAttribute('data-meal-matricule') || '').trim();
	const dayKey = String(button.getAttribute('data-meal-day') || '').trim();
	if (!matricule || !dayKey) return;

	button.disabled = true;
	button.textContent = 'Traitement...';

	const params = new URLSearchParams({
		action: 'markMealTaken',
		matricule,
		day: dayKey,
	});

	loadJsonp(`${WEB_APP_URL}?${params.toString()}`, 15000)
		.then((payload) => {
			if (!payload || payload.success === false) {
				throw new Error((payload && payload.message) || 'Erreur lors de la prise du repas.');
			}

			if (container === elements.searchResults && elements.resultsHint) {
				elements.resultsHint.textContent = payload.alreadyTaken ? 'Ce repas est deja pris.' : 'Repas marque comme pris.';
			}
			return loadData();
		})
		.then(() => {
			if (container === elements.formulaireResults) {
				renderCurrentFormulaireSearch();
			} else {
				runCurrentSearch();
			}
		})
		.catch((error) => {
			if (container === elements.searchResults && elements.resultsHint) {
				elements.resultsHint.textContent = error && error.message ? error.message : 'Impossible de marquer le repas.';
			}
			if (container === elements.formulaireResults) {
				renderCurrentFormulaireSearch();
			} else {
				runCurrentSearch();
			}
		});
}

function setActiveNav(button) {
	const buttons = [elements.navFormulaireButton, elements.navRechercheButton, elements.navRajoutButton].filter(Boolean);
	buttons.forEach((b) => {
		if (b === button) b.classList.add('is-active');
		else b.classList.remove('is-active');
	});
}

function renderRajoutList() {
	if (!elements.rajoutList) return;
	const rowsWithRajout = (state.rows || []).filter((r) => r.rajouts && Object.keys(r.rajouts).length > 0);
	if (!rowsWithRajout.length) {
		elements.rajoutList.innerHTML = '<div class="results-list empty-state">Aucun rajout enregistre.</div>';
		return;
	}

	const abbrev = {
		lundi: 'Lun',
		mardi: 'Mar',
		mercredi: 'Mer',
		jeudi: 'Jeu',
		vendredi: 'Ven',
		samedi: 'Sam',
		dimanche: 'Dim',
	};

	// Sort by matricule for predictability
	rowsWithRajout.sort((a, b) => (a.matricule || '').localeCompare(b.matricule || ''));

	elements.rajoutList.innerHTML = rowsWithRajout
		.map((row) => {
			const days = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
			// build a small inline table showing X for rajout days
			const cells = days.map((d) => (row.rajouts && row.rajouts[d] ? '<td class="rajout-x">X</td>' : '<td></td>')).join('');
			return `
				<article class="result-card">
					<div class="rajout-card-row" style="display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:6px;width:100%;min-width:0;">
						<div class="rajout-card-info" style="display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;min-width:150px;max-width:170px;flex:0 0 160px;">
							<div class="rajout-card-name">${escapeHtml(row.nomPrenom)}</div>
							<div class="rajout-card-meta">${escapeHtml(row.matricule)}</div>
						</div>
						<div class="rajout-card-table" style="flex:1 1 auto;min-width:0;margin-left:0;white-space:nowrap;overflow:hidden;max-width:100%;">
							<table class="rajout-table" style="border-collapse:collapse;white-space:nowrap;width:100%;table-layout:fixed;">
								<thead>
									<tr>
										${days.map((d) => `<th class="rajout-day-th">${escapeHtml(abbrev[d])}</th>`).join('')}
									</tr>
								</thead>
								<tbody>
									<tr>
										${cells}
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</article>
			`;
		})
		.join('');
	if (elements.resultsHint) elements.resultsHint.textContent = '';
	if (elements.searchResults) elements.searchResults.innerHTML = '';
}

function renderRajoutListHtml() {
	const rowsWithRajout = (state.rows || []).filter((r) => r.rajouts && Object.keys(r.rajouts).length > 0);
	if (!rowsWithRajout.length) {
		return '<div class="results-list empty-state">Aucun rajout enregistre.</div>';
	}

	const abbrev = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim' };
	rowsWithRajout.sort((a, b) => (a.matricule || '').localeCompare(b.matricule || ''));

	return rowsWithRajout
		.map((row) => {
			const days = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
			const cells = days.map((d) => (row.rajouts && row.rajouts[d] ? '<td style="text-align:center;font-weight:800;color:var(--accent-strong)">X</td>' : '<td></td>')).join('');
			return `
				<article class="result-card">
					<div class="rajout-card-row" style="display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:6px;width:100%;min-width:0;">
						<div class="rajout-card-info" style="display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;min-width:150px;max-width:170px;flex:0 0 160px;">
							<div class="rajout-card-name">${escapeHtml(row.nomPrenom)}</div>
							<div class="rajout-card-meta">${escapeHtml(row.matricule)}</div>
						</div>
						<div class="rajout-card-table" style="flex:1 1 auto;min-width:0;margin-left:0;white-space:nowrap;overflow:hidden;max-width:100%;">
								<table class="rajout-table" style="border-collapse:collapse;white-space:nowrap;width:100%;table-layout:fixed;">
								<thead>
									<tr>
										${days.map((d) => `<th class="rajout-day-th">${escapeHtml(abbrev[d])}</th>`).join('')}
									</tr>
								</thead>
								<tbody>
									<tr>
										${cells}
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</article>
			`;
		})
		.join('');
}

function openRajoutMainView() {
	// no-op: kept for backward compatibility
}

function closeRajoutMainView() {
	// restore search panel visibility and remove rajout class
	const formulairePanel = document.getElementById('page-formulaire');
	if (formulairePanel) formulairePanel.style.display = '';
	document.body.classList.remove('page-rajout-active');
	// restore idle state
	showIdleState();
}


function scrollToSection(sectionId) {
	const section = document.getElementById(sectionId);
	if (section) {
		section.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
}
function setDefaultRajoutDate() {
	if (!elements.rajoutDate) {
		return;
	}

	const today = new Date();
	const offset = today.getTimezoneOffset() * 60000;
	elements.rajoutDate.value = new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function setDefaultRajoutJour() {
	if (!elements.rajoutJour) {
		return;
	}

	const today = new Date();
	const weekdayIndex = today.getDay();
	const mapping = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
	setRajoutDays([mapping[weekdayIndex] || 'lundi']);
}

function setRajoutMatricule(matricule) {
	state.currentSearchMatricule = normalizeText(matricule);
	if (elements.rajoutMatriculeDisplay) {
		elements.rajoutMatriculeDisplay.textContent = state.currentSearchMatricule
			? state.currentSearchMatricule.toUpperCase()
			: 'Aucun matricule sélectionné';
	}
}

async function loadData() {
    setStatus('Chargement des donnees...');
    
    try {
		const payload = await loadJsonp(`${WEB_APP_URL}?format=json`, 15000);
        
        const normalized = normalizePayload(payload);
        state.rows = normalized.rows;
        state.days = normalized.days;
        if (elements.totalRows) elements.totalRows.textContent = String(normalized.totalRows);
        if (elements.noPlanningCount) elements.noPlanningCount.textContent = String(normalized.noPlanningCount);
        if (elements.noChoiceCount) elements.noChoiceCount.textContent = String(normalized.noChoiceCount);
        if (elements.rajoutCount) elements.rajoutCount.textContent = String(normalized.rajoutCount);
        
        showIdleState();
		if (document.body.classList.contains('page-rajout-active')) {
            renderRajoutList();
		} else if (document.getElementById('page-recherche')?.classList.contains('active')) {
			if (state.currentSearchMatricule) {
				runCurrentSearch();
			} else {
				showIdleState();
			}
		} else if (document.getElementById('page-formulaire')?.classList.contains('active')) {
			renderCurrentFormulaireSearch();
        }
        setStatus('Pret');
    } catch (error) {
        console.error('loadData error:', error);
        
        if (elements.searchResults) {
            elements.searchResults.classList.add('empty-state');

			elements.searchResults.textContent = `${error.message || 'Erreur de chargement.'} Verifiez le deploiement Apps Script et l'acces public de l'URL.`;
        } else {
            console.warn('loadData: searchResults element not found;', error);
        }
        if (elements.resultsHint) elements.resultsHint.textContent = 'Erreur de chargement.';
        setStatus('Erreur');
    }
}

function loadJsonp(baseUrl, timeoutMs) {
	return new Promise((resolve, reject) => {
		const callbackName = `cantineJsonp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
		const separator = baseUrl.includes('?') ? '&' : '?';
		const src = `${baseUrl}${separator}callback=${encodeURIComponent(callbackName)}`;

		let timer = null;
		const script = document.createElement('script');

		function cleanup() {
			if (timer) {
				clearTimeout(timer);
			}
			delete window[callbackName];
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
		}

		window[callbackName] = (data) => {
			cleanup();
			resolve(data);
		};

		script.onerror = () => {
			cleanup();
			reject(new Error('Impossible de charger les donnees depuis Apps Script.'));
		};

		timer = setTimeout(() => {
			cleanup();
			reject(new Error('Temps d\'attente depasse pendant le chargement des donnees.'));
		}, timeoutMs || 15000);

		script.src = src;
		script.async = true;
		document.head.appendChild(script);
	});
}

function onRajoutSubmit(event) {
	event.preventDefault();
	if (!elements.rajoutDate || !elements.rajoutJour) {
		return;
	}

	const matricule = normalizeText(state.currentSearchMatricule);
	const submittedMatricule = state.currentSearchMatricule;
	const dateValue = elements.rajoutDate.value;
	const jours = String(elements.rajoutJour.value || '')
		.split(',')
		.map((value) => normalizeText(value))
		.filter(Boolean);

	if (!matricule || !dateValue || !jours.length) {
		elements.rajoutStatus.textContent = 'Faites d\'abord une recherche pour fixer le matricule, puis choisissez un ou plusieurs jours.';
		return;
	}

	setRajoutSubmittingState(true);
	elements.rajoutStatus.textContent = 'Enregistrement...';

	const params = new URLSearchParams({
		action: 'rajoutAdd',
		matricule,
		date: dateValue,
		jours: jours.join(','),
	});

	loadJsonp(`${WEB_APP_URL}?${params.toString()}`, 15000)
		.then((payload) => {
			elements.rajoutStatus.textContent = payload && payload.updated ? 'Rajout mis à jour.' : 'Rajout ajouté.';
			if (payload && payload.rajoutCount != null) {
				elements.rajoutCount.textContent = String(payload.rajoutCount);
			}

			// Refresh data from server so the new/updated rajout is reflected in the UI
			loadData()
				.then(() => {
					showSection('page-recherche');
					if (document.body.classList.contains('page-rajout-active')) {
						renderRajoutList();
					}
					if (submittedMatricule) {
						runCurrentSearch();
					}
					resetRajoutFormState();
				})
				.catch((err) => {
					// ignore: keep the rajout status already set, but log for debugging
					console.warn('Erreur lors du rafraichissement des donnees:', err);
					setRajoutSubmittingState(false);
				});
		})
		.catch((error) => {
			elements.rajoutStatus.textContent = error && error.message ? error.message : 'Erreur lors de l\'enregistrement.';
			setRajoutSubmittingState(false);
		});
}

function renderWeekdayCell(label, value, fallback) {
	const text = String(value || '').trim() || fallback;
	return `<div class="week-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(text)}</strong></div>`;
}

function renderRajoutDayOptions() {
	if (!elements.rajoutDayButtons || !elements.rajoutJour) return;
	elements.rajoutDayButtons.innerHTML = DAY_OPTIONS.map(
		(day) => `<button type="button" class="rajout-day-button" data-day="${day.key}">${day.label}</button>`,
	).join('');

	elements.rajoutDayButtons.querySelectorAll('.rajout-day-button').forEach((button) => {
		button.addEventListener('click', () => {
			toggleRajoutDay(button.getAttribute('data-day') || '');
		});
	});
}

function setRajoutDays(dayKeys) {
	if (!elements.rajoutJour) return;
	state.selectedRajoutDays = Array.isArray(dayKeys) ? dayKeys.filter(Boolean) : [];
	elements.rajoutJour.value = state.selectedRajoutDays.join(',');
	if (!elements.rajoutDayButtons) return;
	elements.rajoutDayButtons.querySelectorAll('.rajout-day-button').forEach((button) => {
		const isSelected = state.selectedRajoutDays.includes(button.getAttribute('data-day'));
		button.classList.toggle('is-selected', isSelected);
	});
}

function toggleRajoutDay(dayKey) {
	if (!dayKey) return;
	const current = Array.isArray(state.selectedRajoutDays) ? [...state.selectedRajoutDays] : [];
	const index = current.indexOf(dayKey);
	if (index >= 0) {
		current.splice(index, 1);
	} else {
		current.push(dayKey);
	}
	setRajoutDays(current);
}

function normalizePayload(payload) {
	if (payload && Array.isArray(payload.rows)) {
		const summary = computeSummary(payload.rows);
		return {
			rows: payload.rows,
			totalRows: Number(payload.totalRows || payload.rows.length),
			noPlanningCount: Number(payload.noPlanningCount ?? summary.noPlanningCount),
			noChoiceCount: Number(payload.noChoiceCount ?? summary.noChoiceCount),
			rajoutCount: Number(payload.rajoutCount ?? 0),
			days: Array.isArray(payload.days) && payload.days.length ? payload.days : DAY_OPTIONS,
		};
	}

	if (payload && Array.isArray(payload.values)) {
		const rows = fromRawValues(payload.values);
		const summary = computeSummary(rows);
		return {
			rows,
			totalRows: rows.length,
			noPlanningCount: summary.noPlanningCount,
			noChoiceCount: summary.noChoiceCount,
			rajoutCount: 0,
			days: DAY_OPTIONS,
		};
	}

	throw new Error('Format JSON non reconnu.');
}

function fromRawValues(values) {
	if (!Array.isArray(values) || values.length <= 1) {
		return [];
	}

	return values
		.slice(1)
		.filter((row) => Array.isArray(row) && row.some((cell) => String(cell || '').trim() !== ''))
		.map((row) => ({
			matricule: row[0] || '',
			nomPrenom: row[1] || '',
			days: {
				lundi: { planning: row[2] || '', period: row[3] || '', choice: row[4] || '', checking: row[5] || '', isChecked: normalizeText(row[5]) === 'x' },
				mardi: { planning: row[6] || '', period: row[7] || '', choice: row[8] || '', checking: row[9] || '', isChecked: normalizeText(row[9]) === 'x' },
				mercredi: { planning: row[10] || '', period: row[11] || '', choice: row[12] || '', checking: row[13] || '', isChecked: normalizeText(row[13]) === 'x' },
				jeudi: { planning: row[14] || '', period: row[15] || '', choice: row[16] || '', checking: row[17] || '', isChecked: normalizeText(row[17]) === 'x' },
				vendredi: { planning: row[18] || '', period: row[19] || '', choice: row[20] || '', checking: row[21] || '', isChecked: normalizeText(row[21]) === 'x' },
				samedi: { planning: row[22] || '', period: row[23] || '', choice: row[24] || '', checking: row[25] || '', isChecked: normalizeText(row[25]) === 'x' },
				dimanche: { planning: row[26] || '', period: row[27] || '', choice: row[28] || '', checking: row[29] || '', isChecked: normalizeText(row[29]) === 'x' },
			},
		}));
}

function computeSummary(rows) {
	let noPlanningCount = 0;
	let noChoiceCount = 0;

	rows.forEach((row) => {
		const hasPlanning = DAY_OPTIONS.some((day) => String(row.days?.[day.key]?.planning || '').trim() !== '');
		const hasChoice = DAY_OPTIONS.some((day) => String(row.days?.[day.key]?.choice || '').trim() !== '');

		if (!hasPlanning) {
			noPlanningCount += 1;
		}

		if (!hasChoice) {
			noChoiceCount += 1;
		}
	});

	return { noPlanningCount, noChoiceCount };
}

function renderDayOptions() {
	// no longer used; search always shows all days
}

function onSearch(event) {
	event.preventDefault();
	runCurrentSearch();
}

function renderResults(rows, emptyMessage, isEmpty, mode, targetElement) {
	const container = targetElement || elements.searchResults;
	if (!container) return;
	if (isEmpty) {
		container.classList.add('empty-state');
		container.innerHTML = emptyMessage;
		return;
	}

	container.classList.remove('empty-state');
	container.innerHTML = rows
		.map((row) => {
			const isCompact = window.innerWidth <= 420;
			const abbrev = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim' };
			const rajoutDays = Object.keys(row.rajouts || {});
			const dayItems = DAY_OPTIONS;
			const rowIsRajout = isCollaboratorAdded(row);
			const allVisibleReady = dayItems.length > 0 && dayItems.every((day) => isDayReady(row.days?.[day.key]));
			const checkedCount = dayItems.filter((day) => isDayChecked(row.days?.[day.key])).length;
			const stateClass = rowIsRajout ? 'is-added' : (allVisibleReady ? 'is-ok' : 'is-alert');
			const stateLabel = rowIsRajout ? 'Rajouté' : (allVisibleReady ? 'Dossier pret' : 'Dossier incomplet');
			return `
				<article class="result-card result-card--search ${stateClass}">
					<div class="result-topline result-side">
						<p class="result-label">Résultats matricule</p>
						<div>
							<h3>${escapeHtml(row.nomPrenom)}</h3>
							<div class="result-meta-row">
								<span class="result-badge">${escapeHtml(row.matricule)}</span>
								<span class="result-state-pill ${stateClass}">${escapeHtml(stateLabel)}</span>
								${checkedCount ? `<span class="result-state-pill is-checked">${checkedCount} repas cochés</span>` : ''}
							</div>
						</div>
					</div>

					<div class="week-grid">
						${dayItems.map((day) => {
							const dayData = row.days?.[day.key] || {};
							const ready = isDayReady(dayData);
							const checked = isDayChecked(dayData);
							const columnIsRajout = rowIsRajout || rajoutDays.includes(day.key);
							return `
								<div class="week-column ${columnIsRajout ? 'is-rajout' : (ready ? 'is-ready' : 'is-missing')} ${checked ? 'is-checked' : ''}">
									<h4>${escapeHtml(isCompact ? (abbrev[day.key] || day.label) : day.label)}</h4>
									${renderWeekdayCell('Planning', dayData.planning, 'Pas de planning')}
									${renderWeekdayCell('Période', dayData.period, 'Jour / Nuit')}
									${renderWeekdayCell('Choix', dayData.choice, 'Pas de choix')}
									<div class="day-status ${ready ? 'is-ready' : 'is-missing'} ${checked ? 'is-checked' : ''}">${ready ? 'Compatible' : 'Incomplet'}${checked ? ' · repas pris' : ''}</div>
									<div class="day-action-row">
										${renderMealAction(row, day.key, dayData, checked)}
									</div>
								</div>
							`;
						}).join('')}
					</div>

					${rajoutDays.length ? `<div class="search-rajout-note">Rajout déjà noté : ${rajoutDays.map((dayKey) => escapeHtml(DAY_OPTIONS.find((day) => day.key === dayKey)?.label || dayKey)).join(', ')}</div>` : ''}
				</article>
			`;
		})
		.join('');
}

function renderOverview() {
	if (!elements.overviewResults) return;
	if (!Array.isArray(state.rows) || !state.rows.length) {
		elements.overviewResults.classList.add('empty-state');
		elements.overviewResults.textContent = 'Aucune donnée disponible.';
		return;
	}
	if (state.overviewHtml) {
		elements.overviewResults.classList.remove('empty-state');
		elements.overviewResults.innerHTML = state.overviewHtml;
		return;
	}
	elements.overviewResults.classList.remove('empty-state');
	elements.overviewResults.innerHTML = buildOverviewHtml(state.rows);
}

function renderFormulaireResults(rows, emptyMessage, isEmpty, dayKey) {
	const container = elements.formulaireResults;
	if (!container) return;
	if (isEmpty) {
		container.classList.add('empty-state');
		container.innerHTML = emptyMessage;
		return;
	}

	const todayKey = dayKey || getTodayDayKey();
	const dayLabel = getDayLabel(todayKey);
	container.classList.remove('empty-state');
	container.innerHTML = rows
		.map((row) => {
			const dayData = row.days?.[todayKey] || {};
			const displayState = getFormulaireDisplayState(row, dayData);
			const checked = isDayChecked(dayData);
			const showAction = displayState.showAction;
			return `
				<div class="formulaire-result ${displayState.className} ${checked ? 'is-checked' : ''}">
					<div class="formulaire-result-header">
						<div class="formulaire-result-name-block">
							<div class="formulaire-result-name">${escapeHtml(row.nomPrenom)}</div>
							<div class="formulaire-result-matricule">${escapeHtml(row.matricule)}</div>
						</div>
						<div class="formulaire-result-day">${escapeHtml(dayLabel)}</div>
					</div>

					<div class="formulaire-result-grid">
						<div class="formulaire-result-item">
							<span>Matricule - Nom</span>
							<strong>${escapeHtml(row.matricule)} - ${escapeHtml(row.nomPrenom)}</strong>
						</div>
						<div class="formulaire-result-item">
							<span>Période</span>
							<strong>${escapeHtml(dayData.period || 'Jour / Nuit')}</strong>
						</div>
						<div class="formulaire-result-item">
							<span>Planning</span>
							<strong>${escapeHtml(dayData.planning || 'Pas de planning')}</strong>
						</div>
						<div class="formulaire-result-item">
							<span>Choix</span>
							<strong>${escapeHtml(dayData.choice || 'Pas de choix')}</strong>
						</div>
						<div class="formulaire-result-item formulaire-result-item--check ${showAction ? '' : 'is-hidden'}">
							<span>Checking</span>
							${showAction ? `
								<label class="formulaire-checkbox-wrap">
									<input type="checkbox" class="formulaire-meal-checkbox" data-meal-action="take" data-meal-day="${escapeHtml(todayKey)}" data-meal-matricule="${escapeHtml(row.matricule)}" ${checked ? 'checked' : ''} ${checked ? 'disabled' : ''} />
									<strong>${checked ? 'Repas déjà pris' : 'Cocher si le repas est pris'}</strong>
								</label>
							` : '<strong>Aucune action disponible</strong>'}
						</div>
						<div class="formulaire-result-note ${displayState.className} ${checked ? 'is-ok' : ''}">${checked ? 'Ce repas est deja pris.' : displayState.note}</div>
					</div>
					<div class="formulaire-result-status ${displayState.className} ${checked ? 'is-checked' : ''}">${displayState.label}${checked ? ' · repas pris' : ''}</div>
				</div>
			`;
		})
		.join('');
}

function renderCurrentFormulaireSearch() {
	const matricule = String(state.formulaireSearchMatricule || '').trim();
	if (!matricule) {
		showFormulaireIdleState();
		return;
	}

	const matches = state.rows.filter((row) => normalizeText(row.matricule) === normalizeText(matricule));
	if (!matches.length) {
		renderFormulaireResults([], `Aucun resultat pour "${escapeHtml(matricule)}".`, true, getTodayDayKey());
		return;
	}

	renderFormulaireResults(matches, '', false, getTodayDayKey());
}

function resetFormulaireSearch() {
	state.formulaireSearchMatricule = '';
	if (elements.formulaireMatriculeInput) {
		elements.formulaireMatriculeInput.value = '';
	}
	showFormulaireIdleState();
}

function renderMealAction(row, dayKey, dayData, isChecked) {
	const addedCollaborator = isCollaboratorAdded(row);
	const hasPlanning = Boolean(dayData && String(dayData.planning || '').trim());
	const hasChoice = Boolean(dayData && String(dayData.choice || '').trim());
	if (!hasPlanning && !hasChoice && !addedCollaborator) {
		return '<div class="day-action day-action--blocked">Planning ou choix manquant</div>';
	}

	if (isChecked) {
		return '<div class="day-action day-action--taken">Repas deja pris</div>';
	}

	return `<button type="button" class="day-action-button" data-meal-action="take" data-meal-day="${escapeHtml(dayKey)}" data-meal-matricule="${escapeHtml(row.matricule)}">Marquer repas pris</button>`;
}

function createSlideshow(containerId, slidesArray, intervalMs = 3600) {
	const frame = document.getElementById(containerId);
	if (!frame || !Array.isArray(slidesArray) || slidesArray.length === 0) return null;

	frame.innerHTML = slidesArray
		.map((slide, index) => `
			<img
				class="hero-slide${index === 0 ? ' is-active' : ''}"
				src="${escapeHtml(slide.src)}"
				alt="${escapeHtml(slide.alt)}"
				loading="${index === 0 ? 'eager' : 'lazy'}"
				decoding="async"
			/>
		`)
		.join('');

	const slideshow = {
		frame,
		slides: Array.from(frame.querySelectorAll('.hero-slide')),
		index: 0,
		timer: null,
		intervalMs,
	};

	slideshow.activateSlide = (nextIndex) => {
		if (!slideshow.slides.length) return;
		const normalizedIndex = ((nextIndex % slideshow.slides.length) + slideshow.slides.length) % slideshow.slides.length;
		slideshow.index = normalizedIndex;
		slideshow.slides.forEach((s, i) => s.classList.toggle('is-active', i === normalizedIndex));
	};

	slideshow.advance = () => slideshow.activateSlide(slideshow.index + 1);

	frame.addEventListener('mouseenter', () => setHeroSlideshowPlaying(false));
	frame.addEventListener('mouseleave', () => setHeroSlideshowPlaying(true));
	frame.addEventListener('focusin', () => setHeroSlideshowPlaying(false));
	frame.addEventListener('focusout', () => setHeroSlideshowPlaying(true));

	slideshow.activateSlide(0);
	return slideshow;
}

function initializeHeroSlideshow() {
	// create three independent slideshows
	state.heroSlides = {};
	state.heroSlides.left = createSlideshow('slideshow-left', HERO_SLIDES_LEFT, 3800);
	state.heroSlides.center = createSlideshow('slideshow-center', HERO_SLIDES_RIZ, 4200);
	state.heroSlides.right = createSlideshow('slideshow-right', HERO_SLIDES_DESSERTS, 3600);

	// start playing by default
	setHeroSlideshowPlaying(true);
}

function setHeroSlideshowPlaying(shouldPlay) {
	const slidesObj = state.heroSlides || {};
	Object.keys(slidesObj).forEach((key) => {
		const slideshow = slidesObj[key];
		if (!slideshow || !slideshow.slides || slideshow.slides.length < 2) return;

		if (!shouldPlay) {
			if (slideshow.timer) {
				clearInterval(slideshow.timer);
				slideshow.timer = null;
			}
			return;
		}

		if (slideshow.timer) return;
		slideshow.timer = window.setInterval(() => {
			slideshow.advance();
		}, slideshow.intervalMs || 3600);
	});
}

function resetSearch() {
	elements.matriculeInput.value = '';
	elements.matchedRows.textContent = '0';
	setRajoutMatricule('');
	setRajoutDays([]);
	showIdleState();
	elements.resultsHint.textContent = 'Aucun filtre applique.';
	if (elements.searchResults) {
		elements.searchResults.classList.add('empty-state');
		elements.searchResults.textContent = 'Lancez une recherche pour afficher les résultats du matricule.';
	}
}

function showFormulaireIdleState() {
	if (elements.formulaireResults) {
		elements.formulaireResults.classList.add('empty-state');
		elements.formulaireResults.textContent = 'Lancez une recherche dans Formulaire pour voir le jour d’aujourd’hui du matricule recherché.';
	}
}

function showIdleState() {
	if (elements.searchResults) {
		elements.searchResults.classList.add('empty-state');
		elements.searchResults.textContent = 'Lancez une recherche pour afficher les résultats du matricule.';
	} else {
		console.warn('showIdleState: searchResults element not found');
	}
}

function setStatus(message) {
	document.title = `Cantine - ${message}`;
}

function normalizeText(value) {
	return String(value || '')
		.trim()
		.toLowerCase();
}

function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// ==================== CONFIGURATION ====================
const SPREADSHEET_ID = '1q5S-tv8hA3_uzjnFJ6MPvqfYLBB2t0P3F5R0tNm0Okk';
const SHEET_NAME = 'Cantine';

const TOTAL_COLUMNS = 40;
const SIMPLE_RAJOUT_INDEX = 37;
const NEW_COLLABORATOR_INDEX = 38;
const AVATAR_INDEX = 39;

const DAY_CONFIG = [
	{ key: 'lundi', label: 'Lundi', planningIndex: 2, periodIndex: 3, choiceIndex: 4, rajoutIndex: 5, checkingIndex: 6 },
	{ key: 'mardi', label: 'Mardi', planningIndex: 7, periodIndex: 8, choiceIndex: 9, rajoutIndex: 10, checkingIndex: 11 },
	{ key: 'mercredi', label: 'Mercredi', planningIndex: 12, periodIndex: 13, choiceIndex: 14, rajoutIndex: 15, checkingIndex: 16 },
	{ key: 'jeudi', label: 'Jeudi', planningIndex: 17, periodIndex: 18, choiceIndex: 19, rajoutIndex: 20, checkingIndex: 21 },
	{ key: 'vendredi', label: 'Vendredi', planningIndex: 22, periodIndex: 23, choiceIndex: 24, rajoutIndex: 25, checkingIndex: 26 },
	{ key: 'samedi', label: 'Samedi', planningIndex: 27, periodIndex: 28, choiceIndex: 29, rajoutIndex: 30, checkingIndex: 31 },
	{ key: 'dimanche', label: 'Dimanche', planningIndex: 32, periodIndex: 33, choiceIndex: 34, rajoutIndex: 35, checkingIndex: 36 },
];

// ==================== FONCTION PRINCIPALE doGet ====================
function doGet(e) {
	// Gestion des requêtes OPTIONS (preflight CORS pour Chrome)
	if (e && e.method === 'OPTIONS') {
		return handleCorsPreflight();
	}

	const params = (e && e.parameter) || {};
	const wantsJson = String(params.format || '').toLowerCase() === 'json';
	const callback = String(params.callback || '').trim();
	const action = String(params.action || '').trim();
	const includeImages = String(params.includeImages || '').toLowerCase() === 'true';

	// Fonction utilitaire pour créer une réponse avec headers CORS
	function createResponse(data, isJsonp = false, callbackName = '') {
		let output;
		let mimeType;
		
		if (isJsonp && callbackName && callbackName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
			output = ContentService.createTextOutput(`${callbackName}(${JSON.stringify(data)});`);
			mimeType = ContentService.MimeType.JAVASCRIPT;
		} else {
			output = ContentService.createTextOutput(JSON.stringify(data));
			mimeType = ContentService.MimeType.JSON;
		}
		
		output.setMimeType(mimeType);
		
		return output;
	}

	// Traitement de l'action rajoutAdd
	if (action === 'rajoutAdd') {
		try {
			const payload = addRajoutRow(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ 
				success: false, 
				error: error.toString(),
				message: 'Erreur lors de l\'enregistrement du rajout'
			}, !!callback, callback);
		}
	}

	if (action === 'addCollaborator') {
		try {
			const payload = addCollaboratorRow(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({
				success: false,
				error: error.toString(),
				message: 'Erreur lors de l\'ajout du collaborateur',
			}, !!callback, callback);
		}
	}

	if (action === 'markMealTaken') {
		try {
			const payload = markMealTaken(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({
				success: false,
				error: error.toString(),
				message: 'Erreur lors de la prise du repas',
			}, !!callback, callback);
		}
	}

	// Retour des données JSON
	if (wantsJson || callback) {
		try {
			const payload = getDashboardData(includeImages);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ 
				error: error.toString(),
				rows: [],
				totalRows: 0,
				noPlanningCount: 0,
				noChoiceCount: 0,
				simpleRajoutCount: 0,
				newCollaboratorCount: 0,
				rajoutCount: 0,
				days: DAY_CONFIG.map(({ key, label }) => ({ key, label }))
			}, !!callback, callback);
		}
	}

	// Interface HTML par défaut
	return HtmlService.createHtmlOutputFromFile('index')
		.setTitle('Cantine Connecteo')
		.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== GESTION CORS PREFLIGHT ====================
function handleCorsPreflight() {
	const output = ContentService.createTextOutput('');
	output.setMimeType(ContentService.MimeType.TEXT);
	return output;
}

// ==================== FONCTIONS EXISTANTES (à conserver) ====================
function include(filename) {
	return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDashboardData(includeImages) {
	const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

	if (!sheet) {
		throw new Error('Feuille introuvable: ' + SHEET_NAME);
	}

	const values = sheet.getDataRange().getDisplayValues();
	const rajoutIndex = buildRajoutIndex_(values);

	if (values.length <= 1) {
		return {
			rows: [],
			totalRows: 0,
			noPlanningCount: 0,
			noChoiceCount: 0,
			simpleRajoutCount: 0,
			newCollaboratorCount: 0,
			rajoutCount: 0,
			days: DAY_CONFIG.map(({ key, label }) => ({ key, label })),
		};
	}

	const rows = values
		.slice(1)
		.filter((row) => row.some((cell) => String(cell).trim() !== ''))
		.map((row) => ({
			matricule: row[0] || '',
			nomPrenom: row[1] || '',
			days: DAY_CONFIG.reduce((accumulator, day) => {
				const planning = row[day.planningIndex] || '';
				const period = row[day.periodIndex] || '';
				const choice = row[day.choiceIndex] || '';
				const rajout = row[day.rajoutIndex] || '';
				const checking = row[day.checkingIndex] || '';
				const isChecked = String(checking).trim().toUpperCase() === 'X';

				accumulator[day.key] = {
					planning,
					period,
					choice,
					rajout,
					checking,
					isChecked,
				};
				return accumulator;
			}, {}),
			imageBase64: includeImages ? (row[AVATAR_INDEX] || '') : '',
			source: normalizeKey_(row[NEW_COLLABORATOR_INDEX]) === 'x' ? 'AJOUT_FORM' : (normalizeKey_(row[SIMPLE_RAJOUT_INDEX]) === 'x' ? 'RAJOUT_SIMPLE' : ''),
			isSimpleRajout: normalizeKey_(row[SIMPLE_RAJOUT_INDEX]) === 'x',
			isAddedCollaborator: normalizeKey_(row[NEW_COLLABORATOR_INDEX]) === 'x',
			rajouts: rajoutIndex[normalizeKey_(row[0])] || {},
		}));

	const summary = getSummaryCounts_(rows);

	return {
		rows,
		totalRows: rows.length,
		noPlanningCount: summary.noPlanningCount,
		noChoiceCount: summary.noChoiceCount,
		simpleRajoutCount: summary.simpleRajoutCount,
		newCollaboratorCount: summary.newCollaboratorCount,
		rajoutCount: summary.simpleRajoutCount,
		days: DAY_CONFIG.map(({ key, label }) => ({ key, label })),
	};
}

function addRajoutRow(params) {
	const matricule = String(params.matricule || '').trim();
	const dateValue = params.date ? new Date(params.date) : new Date();
	const jourKeys = normalizeDayList_(params.jours || params.jour || params.day || params.dayKey || '');

	if (!matricule) {
		throw new Error('Matricule obligatoire.');
	}

	if (!jourKeys.length) {
		throw new Error('Jour invalide.');
	}

	const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
	if (!sheet) {
		throw new Error('Feuille introuvable: ' + SHEET_NAME);
	}

	const values = sheet.getDataRange().getValues();
	let targetRow = -1;

	for (let i = 1; i < values.length; i += 1) {
		if (normalizeKey_(values[i][0]) === normalizeKey_(matricule)) {
			targetRow = i + 1;
			break;
		}
	}

	if (targetRow < 0) {
		throw new Error('Matricule introuvable.');
	}

	const row = values[targetRow - 1] || [];
	const markerIndex = normalizeKey_(row[NEW_COLLABORATOR_INDEX]) === 'x' ? NEW_COLLABORATOR_INDEX : SIMPLE_RAJOUT_INDEX;

	jourKeys.forEach((jourKey) => {
		const dayConfig = DAY_CONFIG.find((day) => day.key === jourKey);
		if (!dayConfig) return;
		sheet.getRange(targetRow, dayConfig.rajoutIndex + 1).setValue('X');
	});

	sheet.getRange(targetRow, markerIndex + 1).setValue('X');

	const refreshedSummary = getDashboardData();
	const isNewCollaborator = normalizeKey_(sheet.getRange(targetRow, NEW_COLLABORATOR_INDEX + 1).getDisplayValue()) === 'x';

	return {
		success: true,
		message: isNewCollaborator ? 'Rajout enregistré pour le nouveau collaborateur.' : 'Rajout enregistré.',
		jours: jourKeys,
		simpleRajoutCount: refreshedSummary.simpleRajoutCount,
		newCollaboratorCount: refreshedSummary.newCollaboratorCount,
		rajoutCount: refreshedSummary.simpleRajoutCount,
		updated: true,
	};
}

function markMealTaken(params) {
	const matricule = String(params.matricule || '').trim();
	const dayKey = normalizeDayKey_(params.day || params.dayKey || params.jour || '');

	if (!matricule) {
		throw new Error('Matricule obligatoire.');
	}

	if (!dayKey) {
		throw new Error('Jour invalide.');
	}

	const dayConfig = DAY_CONFIG.find((day) => day.key === dayKey);
	if (!dayConfig) {
		throw new Error('Jour inconnu.');
	}

	const lock = LockService.getScriptLock();
	lock.waitLock(5000);
	try {
		const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
		if (!sheet) {
			throw new Error('Feuille introuvable: ' + SHEET_NAME);
		}

		const values = sheet.getDataRange().getValues();
		let targetRow = -1;

		for (let i = 1; i < values.length; i += 1) {
			if (normalizeKey_(values[i][0]) === normalizeKey_(matricule)) {
				targetRow = i + 1;
				break;
			}
		}

		if (targetRow < 0) {
			throw new Error('Matricule introuvable.');
		}

		const checkingCell = sheet.getRange(targetRow, dayConfig.checkingIndex + 1);
		const currentValue = String(checkingCell.getDisplayValue() || '').trim().toUpperCase();
		if (currentValue === 'X') {
			return {
				success: true,
				alreadyTaken: true,
				message: 'Ce repas est deja pris.',
				day: dayKey,
				matricule,
			};
		}

		checkingCell.setValue('X');

		return {
			success: true,
			alreadyTaken: false,
			message: 'Repas marque comme pris.',
			day: dayKey,
			matricule,
		};
	} finally {
		lock.releaseLock();
	}
}

function buildRajoutIndex_(values) {
	const index = {};

	if (!Array.isArray(values) || values.length <= 1) {
		return index;
	}

	values.slice(1).forEach((row) => {
		const matricule = normalizeKey_(row[0]);
		const existingDays = DAY_CONFIG.filter((day) => String(row[day.rajoutIndex] || '').trim().toUpperCase() === 'X').map((day) => day.key);

		if (!matricule || !existingDays.length) {
			return;
		}

		if (!index[matricule]) {
			index[matricule] = {};
		}

		existingDays.forEach((existingDay) => {
			index[matricule][existingDay] = {
				date: '',
				label: 'Rajouté',
			};
		});
	});

	return index;
}

function normalizeKey_(value) {
	return String(value || '').trim().toLowerCase();
}

function normalizeDayKey_(value) {
	const normalized = String(value || '').trim().toLowerCase();
	const mapping = {
		lundi: 'lundi',
		mardi: 'mardi',
		mercredi: 'mercredi',
		jeudi: 'jeudi',
		vendredi: 'vendredi',
		samedi: 'samedi',
		dimanche: 'dimanche',
		monday: 'lundi',
		tuesday: 'mardi',
		wednesday: 'mercredi',
		thursday: 'jeudi',
		friday: 'vendredi',
		saturday: 'samedi',
		sunday: 'dimanche',
	};
	return mapping[normalized] || '';
}

function normalizeDayList_(value) {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeDayKey_(item)).filter(Boolean);
	}

	return String(value || '')
		.split(',')
		.map((item) => normalizeDayKey_(item))
		.filter(Boolean);
}

function getSummaryCounts_(rows) {
	let noPlanningCount = 0;
	let noChoiceCount = 0;
	let simpleRajoutCount = 0;
	let newCollaboratorCount = 0;

	rows.forEach((row) => {
		const hasPlanning = DAY_CONFIG.some((day) => String(row.days[day.key].planning || '').trim() !== '');
		const hasChoice = DAY_CONFIG.some((day) => String(row.days[day.key].choice || '').trim() !== '');
		const isSimpleRajout = Boolean(row && row.isSimpleRajout);
		const isNewCollaborator = Boolean(row && row.isAddedCollaborator);

		if (!hasPlanning) {
			noPlanningCount += 1;
		}

		if (!hasChoice) {
			noChoiceCount += 1;
		}

		if (isSimpleRajout) {
			simpleRajoutCount += 1;
		}

		if (isNewCollaborator) {
			newCollaboratorCount += 1;
		}
	});

	return { noPlanningCount, noChoiceCount, simpleRajoutCount, newCollaboratorCount };
}

function addCollaboratorRow(params) {
	const matricule = String(params.matricule || '').trim();
	const nomPrenom = String(params.nomPrenom || params.nom || '').trim();

	if (!matricule) {
		throw new Error('Matricule obligatoire.');
	}

	if (!nomPrenom) {
		throw new Error('Nom et prénom obligatoires.');
	}

	const lock = LockService.getScriptLock();
	lock.waitLock(5000);
	try {
		const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
		if (!sheet) {
			throw new Error('Feuille introuvable: ' + SHEET_NAME);
		}

		const values = sheet.getDataRange().getValues();
		for (let i = 1; i < values.length; i += 1) {
			if (normalizeKey_(values[i][0]) === normalizeKey_(matricule)) {
				throw new Error('Ce matricule existe déjà.');
			}
		}

		const rowValues = Array(TOTAL_COLUMNS).fill('');
		rowValues[0] = matricule;
		rowValues[1] = nomPrenom;
		rowValues[NEW_COLLABORATOR_INDEX] = 'X';
		sheet.appendRow(rowValues);

		return {
			success: true,
			message: 'Collaborateur ajouté.',
			matricule,
			nomPrenom,
			isAddedCollaborator: true,
		};
	} finally {
		lock.releaseLock();
	}
}
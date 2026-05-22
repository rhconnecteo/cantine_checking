// ==================== CONFIGURATION ====================
const SPREADSHEET_ID = '1q5S-tv8hA3_uzjnFJ6MPvqfYLBB2t0P3F5R0tNm0Okk';
const SHEET_NAME = 'Cantine';
const RAJOUT_SHEET_NAME = 'Rajout';

const DAY_CONFIG = [
	{ key: 'lundi', label: 'Lundi', planningIndex: 2, periodIndex: 3, choiceIndex: 4, checkingIndex: 5 },
	{ key: 'mardi', label: 'Mardi', planningIndex: 6, periodIndex: 7, choiceIndex: 8, checkingIndex: 9 },
	{ key: 'mercredi', label: 'Mercredi', planningIndex: 10, periodIndex: 11, choiceIndex: 12, checkingIndex: 13 },
	{ key: 'jeudi', label: 'Jeudi', planningIndex: 14, periodIndex: 15, choiceIndex: 16, checkingIndex: 17 },
	{ key: 'vendredi', label: 'Vendredi', planningIndex: 18, periodIndex: 19, choiceIndex: 20, checkingIndex: 21 },
	{ key: 'samedi', label: 'Samedi', planningIndex: 22, periodIndex: 23, choiceIndex: 24, checkingIndex: 25 },
	{ key: 'dimanche', label: 'Dimanche', planningIndex: 26, periodIndex: 27, choiceIndex: 28, checkingIndex: 29 },
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
			const payload = getDashboardData();
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ 
				error: error.toString(),
				rows: [],
				totalRows: 0,
				noPlanningCount: 0,
				noChoiceCount: 0,
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

function getDashboardData() {
	const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
	const rajoutSheet = ensureRajoutSheet_();

	if (!sheet) {
		throw new Error('Feuille introuvable: ' + SHEET_NAME);
	}

	const values = sheet.getDataRange().getDisplayValues();
	const rajoutIndex = buildRajoutIndex_(rajoutSheet.getDataRange().getDisplayValues());

	if (values.length <= 1) {
		return {
			rows: [],
			totalRows: 0,
			noPlanningCount: 0,
			noChoiceCount: 0,
			rajoutCount: Math.max(0, rajoutSheet.getLastRow() - 1),
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
				const checking = row[day.checkingIndex] || '';
				const isChecked = String(checking).trim().toUpperCase() === 'X';

				accumulator[day.key] = {
					planning,
					period,
					choice,
					checking,
					isChecked,
				};
				return accumulator;
			}, {}),
			imageBase64: row[30] || '',
			source: row[31] || '',
			isAddedCollaborator: normalizeKey_(row[31]) === 'ajout_form',
			rajouts: rajoutIndex[normalizeKey_(row[0])] || {},
		}));

	const summary = getSummaryCounts_(rows);

	return {
		rows,
		totalRows: rows.length,
		noPlanningCount: summary.noPlanningCount,
		noChoiceCount: summary.noChoiceCount,
		rajoutCount: Math.max(0, rajoutSheet.getLastRow() - 1),
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

	const sheet = ensureRajoutSheet_();

	const dayColMap = {
		lundi: 3,
		mardi: 4,
		mercredi: 5,
		jeudi: 6,
		vendredi: 7,
		samedi: 8,
		dimanche: 9,
	};

	const data = sheet.getDataRange().getValues();
	const matchingRows = [];
	for (let i = 1; i < data.length; i += 1) {
		const rowMat = normalizeKey_(data[i][0]);
		if (rowMat && rowMat === normalizeKey_(matricule)) {
			matchingRows.push(i + 1);
		}
	}

	if (matchingRows.length) {
		const masterRow = matchingRows[0];
		const dayCols = Object.values(dayColMap);

		dayCols.forEach((col) => {
			sheet.getRange(masterRow, col).clearContent();
		});

		jourKeys.forEach((jourKey) => {
			const col = dayColMap[jourKey];
			if (!col) return;
			sheet.getRange(masterRow, col).setValue('X');
		});

		if (dateValue) {
			sheet.getRange(masterRow, 2).setValue(dateValue).setNumberFormat('dd/MM/yyyy');
		}

		matchingRows
			.slice(1)
			.sort((a, b) => b - a)
			.forEach((rowNumber) => {
				sheet.deleteRow(rowNumber);
			});

		return {
			success: true,
			message: 'Rajout mis a jour pour le matricule existant.',
			jours: jourKeys,
			rajoutCount: Math.max(0, sheet.getLastRow() - 1),
			updated: true,
			mergedDuplicates: Math.max(0, matchingRows.length - 1),
		};
	}

	const rowValues = [matricule, dateValue, '', '', '', '', '', '', ''];
	jourKeys.forEach((jourKey) => {
		const col = dayColMap[jourKey];
		if (!col) return;
		rowValues[col - 1] = 'X';
	});
	sheet.appendRow(rowValues);
	const lastRow = sheet.getLastRow();
	if (lastRow > 1) {
		sheet.getRange(lastRow, 2).setNumberFormat('dd/MM/yyyy');
	}

	return {
		success: true,
		message: 'Rajout enregistre.',
		jours: jourKeys,
		rajoutCount: Math.max(0, sheet.getLastRow() - 1),
		updated: false,
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

function ensureRajoutSheet_() {
	const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
	let sheet = spreadsheet.getSheetByName(RAJOUT_SHEET_NAME);

	if (!sheet) {
		sheet = spreadsheet.insertSheet(RAJOUT_SHEET_NAME);
	}

	const headers = ['Matricule', 'Date', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
	sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
	sheet.setFrozenRows(1);

	return sheet;
}

function buildRajoutIndex_(values) {
	const index = {};

	if (!Array.isArray(values) || values.length <= 1) {
		return index;
	}

	values.slice(1).forEach((row) => {
		const matricule = normalizeKey_(row[0]);
		const dateValue = row[1] ? new Date(row[1]) : null;
		const existingDays = findRajoutDaysFromRow_(row);

		if (!matricule || !existingDays.length) {
			return;
		}

		if (!index[matricule]) {
			index[matricule] = {};
		}

		existingDays.forEach((existingDay) => {
			index[matricule][existingDay] = {
				date: dateValue ? Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
				label: 'Rajouté',
			};
		});
	});

	return index;
}

function findRajoutDaysFromRow_(row) {
	const dayIndexes = {
		lundi: 2,
		mardi: 3,
		mercredi: 4,
		jeudi: 5,
		vendredi: 6,
		samedi: 7,
		dimanche: 8,
	};

	const days = [];
	const keys = Object.keys(dayIndexes);
	for (let i = 0; i < keys.length; i += 1) {
		const key = keys[i];
		if (String(row[dayIndexes[key]] || '').trim().toUpperCase() === 'X') {
			days.push(key);
		}
	}

	if (days.length) {
		return days;
	}

	const fallbackDay = normalizeDayKey_(row[2]);
	return fallbackDay ? [fallbackDay] : [];
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

	rows.forEach((row) => {
		const hasPlanning = DAY_CONFIG.some((day) => String(row.days[day.key].planning || '').trim() !== '');
		const hasChoice = DAY_CONFIG.some((day) => String(row.days[day.key].choice || '').trim() !== '');

		if (!hasPlanning) {
			noPlanningCount += 1;
		}

		if (!hasChoice) {
			noChoiceCount += 1;
		}
	});

	return { noPlanningCount, noChoiceCount };
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

		const rowValues = Array(31).fill('');
		rowValues[0] = matricule;
		rowValues[1] = nomPrenom;
		rowValues[31] = 'AJOUT_FORM';
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
const SPREADSHEET_ID = '1q5S-tv8hA3_uzjnFJ6MPvqfYLBB2t0P3F5R0tNm0Okk';
const SHEET_NAME = 'Cantine';
const RAJOUT_SHEET_NAME = 'Rajout';

const DAY_CONFIG = [
	{ key: 'lundi', label: 'Lundi', planningIndex: 2, choiceIndex: 3 },
	{ key: 'mardi', label: 'Mardi', planningIndex: 4, choiceIndex: 5 },
	{ key: 'mercredi', label: 'Mercredi', planningIndex: 6, choiceIndex: 7 },
	{ key: 'jeudi', label: 'Jeudi', planningIndex: 8, choiceIndex: 9 },
	{ key: 'vendredi', label: 'Vendredi', planningIndex: 10, choiceIndex: 11 },
	{ key: 'samedi', label: 'Samedi', planningIndex: 12, choiceIndex: 13 },
	{ key: 'dimanche', label: 'Dimanche', planningIndex: 14, choiceIndex: 15 },
];

function doGet(e) {
	const params = (e && e.parameter) || {};
	const wantsJson = String(params.format || '').toLowerCase() === 'json';
	const callback = String(params.callback || '').trim();
	const action = String(params.action || '').trim();

	if (action === 'rajoutAdd') {
		const payload = addRajoutRow(params);
		if (callback) {
			const body = `${callback}(${JSON.stringify(payload)});`;
			return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
		}
		return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
	}

	if (wantsJson || callback) {
		const payload = getDashboardData();

		if (callback) {
			const body = `${callback}(${JSON.stringify(payload)});`;
			return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
		}

		return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
	}

	return HtmlService.createHtmlOutputFromFile('index')
		.setTitle('Cantine')
		.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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
				accumulator[day.key] = {
					planning: row[day.planningIndex] || '',
					choice: row[day.choiceIndex] || '',
				};
				return accumulator;
			}, {}),
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

	// Columns in Rajout sheet: 1=Matricule, 2=Date, 3=Lundi ... 9=Dimanche
	const dayColMap = {
		lundi: 3,
		mardi: 4,
		mercredi: 5,
		jeudi: 6,
		vendredi: 7,
		samedi: 8,
		dimanche: 9,
	};

	// Try to find all existing rows for the same matricule (normalized)
	const data = sheet.getDataRange().getValues();
	const matchingRows = [];
	for (let i = 1; i < data.length; i += 1) {
		const rowMat = normalizeKey_(data[i][0]);
		if (rowMat && rowMat === normalizeKey_(matricule)) {
			matchingRows.push(i + 1); // sheet rows are 1-based
		}
	}

	if (matchingRows.length) {
		const masterRow = matchingRows[0];
		const dayCols = Object.values(dayColMap);

		// Sync the master row exactly to the current selection: selected days get X,
		// all other day cells are cleared so the sheet matches the latest update.
		dayCols.forEach((col) => {
			sheet.getRange(masterRow, col).clearContent();
		});

		jourKeys.forEach((jourKey) => {
			const col = dayColMap[jourKey];
			if (!col) return;
			sheet.getRange(masterRow, col).setValue('X');
		});

		// Keep the most recent date on the master row.
		if (dateValue) {
			sheet.getRange(masterRow, 2).setValue(dateValue).setNumberFormat('dd/MM/yyyy');
		}

		// Remove any duplicate rows for the same matricule so the sheet stays unique.
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

	// No existing row found -> append a new one
	const rowValues = [matricule, dateValue, '', '', '', '', '', '', ''];
	jourKeys.forEach((jourKey) => {
		const col = dayColMap[jourKey];
		if (!col) return;
		// convert to 0-based index for the array
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

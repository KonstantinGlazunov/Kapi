(function () {
  "use strict";
  const CHAPTERS = Object.freeze([
    { id: "numbers-5", first: 1, last: 3, de: "Mengen & Zahlen bis 5", ru: "Количество и числа до 5", detailDe: "Mengen erkennen und kleine Zahlen verbinden", detailRu: "Узнаём количество и маленькие числа" },
    { id: "plus-10", first: 4, last: 5, de: "Plus bis 10", ru: "Сложение до 10", detailDe: "Zahlen zerlegen und addieren", detailRu: "Разбираем состав числа и складываем" },
    { id: "minus-10", first: 6, last: 8, de: "Minus bis 10", ru: "Вычитание до 10", detailDe: "Wegnehmen und Plus mit Minus verbinden", detailRu: "Убираем и связываем сложение с вычитанием" },
    { id: "numbers-20", first: 9, last: 9, de: "Zahlen bis 20", ru: "Числа до 20", detailDe: "Zehner und Einer verstehen", detailRu: "Понимаем десятки и единицы" },
    { id: "plus-minus-20", first: 10, last: 14, de: "Plus & Minus bis 20", ru: "Сложение и вычитание до 20", detailDe: "Mit und ohne Zehnerübergang", detailRu: "С переходом через десяток и без него" },
    { id: "to-100", first: 15, last: 18, de: "Bis 100", ru: "До 100", detailDe: "Größere Zahlen und Stellenwerte", detailRu: "Большие числа и разряды" },
    { id: "multiply", first: 19, last: 20, de: "Malnehmen", ru: "Умножение", detailDe: "Gleiche Gruppen und erste Reihen", detailRu: "Одинаковые группы и первые ряды" },
    { id: "divide-and-tables", first: 21, last: 24, de: "Teilen & Einmaleins", ru: "Деление и таблица умножения", detailDe: "Teilen und die Einmaleins-Reihen", detailRu: "Деление и таблица умножения" },
    { id: "large-numbers", first: 25, last: 29, de: "Große Zahlen", ru: "Большие числа", detailDe: "Rechnen bis 10.000 und darüber", detailRu: "Считаем до 10 000 и дальше" },
    { id: "squares-cubes", first: 30, last: 30, de: "Quadrate & Kubikzahlen", ru: "Квадраты и кубы", detailDe: "Zahlen mehrmals mit sich multiplizieren", detailRu: "Умножаем число само на себя" },
    { id: "fractions-decimals", first: 31, last: 35, de: "Brüche & Dezimalzahlen", ru: "Дроби и десятичные числа", detailDe: "Teile eines Ganzen und Kommazahlen", detailRu: "Части целого и десятичные числа" },
    { id: "negative", first: 36, last: 37, de: "Negative Zahlen", ru: "Отрицательные числа", detailDe: "Rechnen unter null", detailRu: "Считаем ниже нуля" },
    { id: "powers-roots", first: 38, last: 41, de: "Potenzen & Wurzeln", ru: "Степени и корни", detailDe: "Potenzen und Wurzeln verstehen", detailRu: "Понимаем степени и корни" }
  ]);
  class KapiCurriculumMap {
    getChapters() { return CHAPTERS; }
    chapterForStage(stage) { return CHAPTERS.find((chapter) => stage >= chapter.first && stage <= chapter.last) || null; }
    chaptersAt(stage) {
      const current = Math.max(1, Math.min(41, Number(stage) || 1));
      return CHAPTERS.map((chapter) => ({ ...chapter,
        status: current > chapter.last ? "completed" : current < chapter.first ? "locked" : "current",
        step: current < chapter.first ? 0 : current > chapter.last ? chapter.last - chapter.first + 1 : current - chapter.first + 1,
        total: chapter.last - chapter.first + 1
      }));
    }
  }
  window.KapiCurriculumMap = KapiCurriculumMap;
  window.KAPI_CURRICULUM_CHAPTERS = CHAPTERS;
})();

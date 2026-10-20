const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');
for (const [browserLanguage, expected] of [['ru-RU','ru'],['ru','ru'],['RU-ru','ru'],['de-AT','de'],['en-US','de'],['','de']]) {
  test(`first launch uses ${expected} for browser ${browserLanguage}`, () => {
    const env = environment({app:true,browserLanguage});
    assert.equal(env.sandbox.__app.appSettings.language, expected);
    assert.equal(env.sandbox.document.documentElement.lang, expected);
  });
}
test('first preferred browser language takes precedence over navigator.language', () => {
  const env = environment({app:true,browserLanguage:'de-DE',browserLanguages:['ru-RU','de-DE']});
  assert.equal(env.sandbox.__app.appSettings.language,'ru');
});
for (const saved of ['ru','de']) {
  test(`saved ${saved} overrides a different browser language on subsequent launches`, () => {
    const env = environment({app:true,browserLanguage:saved==='ru'?'de-DE':'ru-RU',savedSettings:{language:saved}});
    assert.equal(env.sandbox.__app.appSettings.language,saved);
  });
}

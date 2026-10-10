"""E2E with Playwright: run after `pip install playwright` and browser installation.
Starts against http://127.0.0.1:8000/ and exits non-zero if a core control fails.
"""
import json
from playwright.sync_api import sync_playwright

URL='http://127.0.0.1:8000/'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.goto(URL,wait_until='networkidle')
    page.locator('#sectorName').wait_for(state='visible')
    assert page.locator('#galaxyMap button').count()==24
    assert page.locator('#crew .member').count()==5
    page.locator('#theme').select_option('amber')
    assert page.locator('html').get_attribute('data-theme')=='amber'
    page.locator('#audioToggle').click()
    assert page.locator('#audioToggle').get_attribute('aria-pressed')=='true'
    page.locator('#audioToggle').click()
    page.locator('#motionToggle').click()
    assert page.locator('#motionToggle').get_attribute('aria-pressed')=='true'
    page.locator('#motionToggle').click()
    page.locator('#scan').click()
    assert page.locator('#scan').is_disabled()
    if page.locator('#decision').evaluate('(e)=>e.open'):
        options=page.locator('#options button:not([disabled])')
        assert options.count()>0
        options.first.click()
    assert page.locator('#sectorName').inner_text()
    page.locator('#expCrew1').select_option(index=0)
    page.locator('#expCrew2').select_option(index=1)
    page.locator('#expApproach').select_option('bold')
    assert page.locator('#expOdds').inner_text()
    page.locator('#galaxyMap button.connected').first.click()
    focused=page.locator('#galaxyMap button:focus')
    assert focused.count()==1,'Selecting a system must preserve keyboard focus'
    assert page.locator('#routeInfo').inner_text()
    assert page.locator('#powerControls input').count()==4
    page.locator('#applyPower').click()
    assert 'redistribuida' in page.locator('#powerFeedback').inner_text().lower()
    page.locator('#crew select').first.select_option('bridge')
    assert page.locator('#crew select').first.input_value()=='bridge'
    with page.expect_download() as download_info:
        page.locator('#export').click()
    download=download_info.value
    path=download.path()
    assert json.loads(open(path,encoding='utf-8').read())['schemaVersion']>=1
    with page.expect_file_chooser() as chooser_info:
        page.locator('#importTrigger').click()
    page.once('dialog',lambda dialog:dialog.accept())
    chooser_info.value.set_files(str(path))
    assert not errors,errors
    print('E2E PASS: map, crew, scanning, decisions, theme, audio, motion, energy, export, import dialog, JS errors')
    browser.close()

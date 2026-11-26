import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

const SUPABASE_URL = 'https://cxwlfplkimnqlzmdsajj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ISAB6iARgJB_F0n9kr4l-A_4NLPH4_n';
const CMS_KEY = 'site.builder.v1';
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function rootFor(element) {
  const section = element.closest('section[id]');
  if (section) return { element: section, prefix: '#' + section.id, label: section.id };
  const header = element.closest('header');
  if (header) return { element: header, prefix: 'header', label: 'Navigation' };
  const footer = element.closest('footer');
  if (footer) return { element: footer, prefix: 'footer', label: 'Pied de page' };
  return { element: element.ownerDocument.body, prefix: 'body', label: 'Page' };
}

function selectorWithin(element, root) {
  const parts = [];
  let current = element;
  while (current && current !== root) {
    let part = current.tagName.toLowerCase();
    const classes = Array.from(current.classList || []).filter((name) => /^[a-zA-Z_-][\w-]*$/.test(name)).slice(0, 2);
    if (classes.length) part += '.' + classes.join('.');
    const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((node) => node.tagName === current.tagName) : [];
    if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

function selectorFor(element) {
  if (element.id) return '#' + element.id;
  const root = rootFor(element);
  const path = selectorWithin(element, root.element);
  return root.prefix + (path ? ' > ' + path : '');
}

function textOf(element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

async function scanPublicPage() {
  const response = await fetch('/index.html', { cache: 'no-store' });
  if (!response.ok) throw new Error('Impossible de lire la structure du portfolio (' + response.status + ').');
  const html = await response.text();
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const textSelectors = 'h1,h2,h3,h4,p,li,a,span,button';
  const fields = [];
  $$(textSelectors, parsed).forEach((element) => {
    if (element.closest('.hadassa-splash') || element.closest('[aria-hidden="true"]')) return;
    if (element.closest('.number,.arrow,.dot,.icon,.quote-mark,.avatar,.splash-loading,.splash-caption')) return;
    const root = rootFor(element);
    Array.from(element.childNodes).forEach((node, nodeIndex) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const raw = node.textContent || '';
      const value = raw.replace(/\s+/g, ' ').trim();
      if (!value || value.length > 500) return;
      const selector = selectorFor(element);
      const prefix = (raw.match(/^\s*/) || [''])[0];
      const suffix = (raw.match(/\s*$/) || [''])[0];
      fields.push({ selector, nodeIndex, value, prefix, suffix, section: root.label, label: value.slice(0, 90) });
    });
  });

  const images = [];
  $$('img', parsed).forEach((element) => {
    if (element.closest('.hadassa-splash')) return;
    images.push({
      selector: selectorFor(element),
      src: element.getAttribute('src') || '',
      alt: element.getAttribute('alt') || '',
      label: element.getAttribute('alt') || element.getAttribute('src') || 'Image'
    });
  });

  const links = [];
  $$('a[href]', parsed).forEach((element) => {
    const href = element.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;
    links.push({
      selector: selectorFor(element),
      href,
      label: textOf(element).slice(0, 90) || 'Lien'
    });
  });

  const sections = $$('main > section[id]', parsed).map((element) => ({
    id: element.id,
    label: textOf(element.querySelector('h1,h2') || element.querySelector('.section-label') || element).slice(0, 70) || element.id,
    visible: true
  }));

  const gridSelectors = [
    '.about-grid', '.services-grid', '.portfolio-grid', '.events-gallery',
    '.events-stats', '.testimonials-grid', '.process-grid'
  ];
  const grids = [];
  gridSelectors.forEach((gridSelector) => {
    const container = $(gridSelector, parsed);
    if (!container) return;
    const items = Array.from(container.children).map((item) => ({
      selector: selectorFor(item),
      label: textOf(item.querySelector('h3,h4') || item).slice(0, 65) || 'Élément'
    }));
    if (items.length > 1) grids.push({ selector: selectorFor(container), label: gridSelector.replace('.', ''), items });
  });

  return { fields, images, links, sections, grids };
}

function cloneDefaults(scan) {
  return {
    fields: scan.fields.map((item) => ({ selector: item.selector, value: item.value, section: item.section, label: item.label })),
    images: scan.images.map((item) => ({ selector: item.selector, src: item.src, alt: item.alt, label: item.label })),
    links: scan.links.map((item) => ({ selector: item.selector, href: item.href, label: item.label })),
    sections: scan.sections.map((item) => ({ ...item })),
    grids: scan.grids.map((grid) => ({ selector: grid.selector, label: grid.label, order: grid.items.map((item) => item.selector), labels: grid.items.map((item) => item.label), hidden: [] }))
  };
}

function renderEditor(root, state, scan) {
  const sectionRows = state.sections.map((section, index) =>
    '<div class="builder-section-row"><label class="check"><input type="checkbox" data-section-visible="' + escapeHtml(section.id) + '" ' + (section.visible !== false ? 'checked' : '') + '> <span><b>' + escapeHtml(section.label) + '</b><small>#' + escapeHtml(section.id) + '</small></span></label><div class="builder-move"><button type="button" data-section-move="' + index + '" data-dir="-1" ' + (index === 0 ? 'disabled' : '') + '>↑</button><button type="button" data-section-move="' + index + '" data-dir="1" ' + (index === state.sections.length - 1 ? 'disabled' : '') + '>↓</button></div></div>'
  ).join('');

  const fieldGroups = new Map();
  state.fields.forEach((field, index) => {
    const group = field.section || 'Page';
    if (!fieldGroups.has(group)) fieldGroups.set(group, []);
    fieldGroups.get(group).push({ ...field, index });
  });
  const textPanels = Array.from(fieldGroups.entries()).map(([group, fields]) =>
    '<details class="builder-group" open><summary>' + escapeHtml(group) + ' <small>' + fields.length + ' champs</small></summary><div class="builder-fields">' +
    fields.map((field) => '<label class="builder-field"><span>' + escapeHtml(field.label) + '</span><textarea rows="2" data-field-index="' + field.index + '">' + escapeHtml(field.value) + '</textarea></label>').join('') +
    '</div></details>'
  ).join('');

  const imageRows = state.images.map((image, index) =>
    '<article class="builder-asset"><b>' + escapeHtml(image.label) + '</b><label>Adresse de l’image<input type="url" data-image-src="' + index + '" value="' + escapeHtml(image.src) + '" placeholder="https://… ou media/fichier.jpg"></label><label>Texte alternatif<input data-image-alt="' + index + '" value="' + escapeHtml(image.alt) + '"></label></article>'
  ).join('');

  const linkRows = state.links.map((link, index) =>
    '<label class="builder-field"><span>' + escapeHtml(link.label) + '</span><input data-link-href="' + index + '" value="' + escapeHtml(link.href) + '" placeholder="https://…"></label>'
  ).join('');

  const gridRows = state.grids.map((grid, gridIndex) => {
    const rows = grid.order.map((selector, itemIndex) => {
      const label = grid.labels[scan.grids.find((candidate) => candidate.selector === grid.selector)?.items.findIndex((item) => item.selector === selector)] || ('Élément ' + (itemIndex + 1));
      return '<div class="builder-section-row"><label class="check"><input type="checkbox" data-grid-visible="' + gridIndex + '" data-grid-selector="' + escapeHtml(selector) + '" ' + (!(grid.hidden || []).includes(selector) ? 'checked' : '') + '> ' + escapeHtml(label) + '</label><div class="builder-move"><button type="button" data-grid-move="' + gridIndex + '" data-item="' + itemIndex + '" data-dir="-1" ' + (itemIndex === 0 ? 'disabled' : '') + '>↑</button><button type="button" data-grid-move="' + gridIndex + '" data-item="' + itemIndex + '" data-dir="1" ' + (itemIndex === grid.order.length - 1 ? 'disabled' : '') + '>↓</button></div></div>';
    }).join('');
    return '<details class="builder-group"><summary>' + escapeHtml(grid.label) + ' <small>' + grid.order.length + ' éléments</small></summary>' + rows + '</details>';
  }).join('');

  root.innerHTML =
    '<div class="builder-toolbar"><div><p class="eyebrow">ÉDITEUR DU PORTFOLIO</p><h3>Modifier le site public</h3><p class="hint">Les changements sont enregistrés dans Supabase et appliqués au site public. Enregistrez avant de prévisualiser.</p></div><div class="builder-actions"><button type="button" class="secondary" id="builder-refresh">Recharger les valeurs du site</button><button type="button" class="primary" id="builder-save">Enregistrer les modifications</button><a class="secondary builder-preview" href="/" target="_blank" rel="noopener">Prévisualiser le site ↗</a></div></div>' +
    '<div class="builder-layout"><div class="builder-panel"><h4>Sections du site</h4><p class="hint">Masquez une section ou changez son ordre sur la page.</p>' + sectionRows + '</div>' +
    '<div class="builder-panel"><h4>Textes et cartes</h4><p class="hint">Chaque texte repéré dans les titres, paragraphes, boutons et cartes peut être modifié ici.</p>' + textPanels + '</div>' +
    '<div class="builder-panel"><h4>Images et liens</h4><p class="hint">Remplacez les adresses des images et les destinations des liens. Les emplacements vidéo et la photo principale restent aussi accessibles dans Médias.</p><details class="builder-group" open><summary>Images <small>' + state.images.length + '</small></summary>' + imageRows + '</details><details class="builder-group"><summary>Liens et boutons <small>' + state.links.length + '</small></summary><div class="builder-fields">' + linkRows + '</div></details></div>' +
    '<div class="builder-panel"><h4>Disposition des cartes</h4><p class="hint">Réorganisez les cartes et les éléments des grilles avec les flèches.</p>' + gridRows + '</div></div>';
}

export function initSiteEditor({ toast, log, user }) {
  const root = document.querySelector('#builder-editor');
  if (!root) return async () => {};
  let scan = null;
  let state = null;

  async function load() {
    root.innerHTML = '<p class="hint">Analyse de la structure du portfolio…</p>';
    scan = await scanPublicPage();
    const result = await client.from('hadassa_site_content').select('*').eq('content_key', CMS_KEY).maybeSingle();
    if (result.error) throw result.error;
    state = result.data?.content ? { ...cloneDefaults(scan), ...result.data.content } : cloneDefaults(scan);
    renderEditor(root, state, scan);
  }

  function moveItem(list, index, direction) {
    const next = index + direction;
    if (next < 0 || next >= list.length) return;
    [list[index], list[next]] = [list[next], list[index]];
  }

  async function save() {
    const payload = {
      content_key: CMS_KEY,
      label: 'Éditeur visuel du portfolio',
      category: 'site_builder',
      content: state,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null
    };
    const result = await client.from('hadassa_site_content').upsert(payload, { onConflict: 'content_key' });
    if (result.error) throw result.error;
    await log('save_site_builder', 'hadassa_site_content', CMS_KEY, {
      text_fields: state.fields.length,
      images: state.images.length,
      links: state.links.length,
      sections: state.sections.length
    });
    toast('Modifications enregistrées. Rechargez le site public pour les voir.');
  }

  root.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('[data-field-index]')) state.fields[Number(target.dataset.fieldIndex)].value = target.value;
    if (target.matches('[data-image-src]')) state.images[Number(target.dataset.imageSrc)].src = target.value;
    if (target.matches('[data-image-alt]')) state.images[Number(target.dataset.imageAlt)].alt = target.value;
    if (target.matches('[data-link-href]')) state.links[Number(target.dataset.linkHref)].href = target.value;
  });

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('[data-section-visible]')) {
      const section = state.sections.find((item) => item.id === target.dataset.sectionVisible);
      if (section) section.visible = target.checked;
    }
    if (target.matches('[data-grid-visible]')) {
      const grid = state.grids[Number(target.dataset.gridVisible)];
      const selector = target.dataset.gridSelector;
      grid.hidden = grid.hidden || [];
      if (target.checked) grid.hidden = grid.hidden.filter((item) => item !== selector);
      else if (!grid.hidden.includes(selector)) grid.hidden.push(selector);
    }
  });

  root.addEventListener('click', async (event) => {
    const refresh = event.target.closest('#builder-refresh');
    if (refresh) { try { await load(); toast('Structure rechargée depuis le site.'); } catch (error) { toast(error.message); } return; }
    const saveButton = event.target.closest('#builder-save');
    if (saveButton) { saveButton.disabled = true; try { await save(); } catch (error) { toast(error.message); } finally { saveButton.disabled = false; } return; }
    const sectionMove = event.target.closest('[data-section-move]');
    if (sectionMove) {
      moveItem(state.sections, Number(sectionMove.dataset.sectionMove), Number(sectionMove.dataset.dir));
      renderEditor(root, state, scan);
      return;
    }
    const gridMove = event.target.closest('[data-grid-move]');
    if (gridMove) {
      const grid = state.grids[Number(gridMove.dataset.gridMove)];
      moveItem(grid.order, Number(gridMove.dataset.item), Number(gridMove.dataset.dir));
      renderEditor(root, state, scan);
    }
  });

  return load;
}

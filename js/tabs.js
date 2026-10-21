/*
  Tabs, following the W3C APG Tabs pattern with automatic activation.
  Markup without JavaScript: one block per panel, each with its own h3, all visible.
  This script builds a tablist from the h3 text, adds tab and tabpanel roles,
  and uses a roving tabindex: only the selected tab is in the Tab order.
  Left and Right arrows move and wrap, Home and End jump to the ends.
*/
(function () {
  'use strict';

  const ns = (window.CnxLesson = window.CnxLesson || {});

  function uid(prefix) {
    let id;
    do {
      ns.idCount = (ns.idCount || 0) + 1;
      id = 'cnx-' + prefix + '-' + ns.idCount;
    } while (document.getElementById(id));
    return id;
  }

  ns.Tabs = function (root) {
    const panels = Array.prototype.filter.call(root.children, function (child) {
      return child.classList.contains('cnx-tabs__panel');
    });
    if (panels.length < 2) {
      throw new Error('tabs need at least two .cnx-tabs__panel elements');
    }
    const label = root.getAttribute('data-label');
    if (!label) {
      throw new Error('tabs need a data-label for the tablist name');
    }

    const tablist = document.createElement('div');
    tablist.className = 'cnx-tabs__list';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', label);

    const tabs = panels.map(function (panel) {
      const title = panel.querySelector('.cnx-tabs__title');
      if (!title) {
        throw new Error('each panel needs a .cnx-tabs__title');
      }
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'cnx-tabs__tab';
      tab.id = uid('tab');
      tab.setAttribute('role', 'tab');
      tab.textContent = title.textContent.trim();

      if (!panel.id) {
        panel.id = uid('tabpanel');
      }
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.setAttribute('tabindex', '0');
      // The tab now names the panel, so the static heading would repeat it.
      title.hidden = true;

      tablist.appendChild(tab);
      return tab;
    });

    let current = 0;

    function select(index, moveFocus) {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach(function (tab, i) {
        const selected = i === current;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.setAttribute('tabindex', selected ? '0' : '-1');
        panels[i].hidden = !selected;
      });
      if (moveFocus) {
        tabs[current].focus();
      }
    }

    tablist.addEventListener('click', function (event) {
      const index = tabs.indexOf(event.target.closest('[role="tab"]'));
      if (index > -1) {
        select(index, false);
      }
    });

    tablist.addEventListener('keydown', function (event) {
      const keys = {
        ArrowRight: current + 1,
        ArrowLeft: current - 1,
        Home: 0,
        End: tabs.length - 1
      };
      if (!(event.key in keys) || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      select(keys[event.key], true);
    });

    root.insertBefore(tablist, panels[0]);
    select(0, false);
  };
})();

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Nav —— */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var header = document.getElementById("top-nav");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 16) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* —— PLAY / WATCH / STUDY tabs —— */
  var pathTabs = Array.prototype.slice.call(document.querySelectorAll(".path-tab"));
  var pathPanels = {
    play: document.getElementById("panel-play"),
    watch: document.getElementById("panel-watch"),
    study: document.getElementById("panel-study"),
  };

  function selectPath(name, focusTab) {
    pathTabs.forEach(function (tab) {
      var on = tab.getAttribute("data-path") === name;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    Object.keys(pathPanels).forEach(function (key) {
      var panel = pathPanels[key];
      if (!panel) return;
      panel.hidden = key !== name;
    });
    if (focusTab) {
      var t = pathTabs.find(function (x) {
        return x.getAttribute("data-path") === name;
      });
      if (t) t.focus({ preventScroll: true });
    }
  }

  pathTabs.forEach(function (tab, i) {
    tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
    tab.addEventListener("click", function () {
      selectPath(tab.getAttribute("data-path"), false);
    });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = pathTabs[(i + 1) % pathTabs.length];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = pathTabs[(i - 1 + pathTabs.length) % pathTabs.length];
      if (e.key === "Home") next = pathTabs[0];
      if (e.key === "End") next = pathTabs[pathTabs.length - 1];
      if (next) {
        e.preventDefault();
        selectPath(next.getAttribute("data-path"), true);
      }
    });
  });

  /* —— Core loop stages —— */
  var STAGES = {
    play: {
      label: "Stage · PLAY",
      title: "PLAY",
      body: "Chamber substrate — rooms, budgets, agents, ledgered events. World truth lives here.",
    },
    notice: {
      label: "Stage · NOTICE",
      title: "NOTICE",
      body: "Situation search (Frontier) and detection (Observatory). Interesting behavior — not production mutation.",
    },
    test: {
      label: "Stage · TEST",
      title: "TEST",
      body: "Isolated Lab forks. Change one condition, compare versions, keep counterevidence. Never mutates production.",
    },
    capture: {
      label: "Stage · CAPTURE",
      title: "CAPTURE AS TEST",
      body: "From a READY Lab result, package a reusable captured behavioral test with provenance and limits.",
    },
    learn: {
      label: "Stage · LEARN",
      title: "LEARN",
      body: "What reproduced, what it depends on, where it generalizes, what remains untested — evidence-backed, no ranking.",
    },
  };

  var stageLabel = document.getElementById("loop-stage-label");
  var stageDetail = document.getElementById("loop-detail");
  var nodes = Array.prototype.slice.call(document.querySelectorAll(".g-node"));
  var stageKeys = ["play", "notice", "test", "capture", "learn"];
  var stageIndex = 0;
  var stageTimer = null;

  function setStage(key, user) {
    var s = STAGES[key];
    if (!s) return;
    stageIndex = stageKeys.indexOf(key);
    if (stageLabel) stageLabel.textContent = s.label;
    if (stageDetail) {
      stageDetail.innerHTML = "<strong>" + s.title + "</strong><span>" + s.body + "</span>";
    }
    nodes.forEach(function (g) {
      g.classList.toggle("is-active", g.getAttribute("data-stage") === key);
    });
    if (user && stageTimer) {
      clearInterval(stageTimer);
      stageTimer = null;
    }
  }

  nodes.forEach(function (g) {
    var key = g.getAttribute("data-stage");
    var hit = g.querySelector(".node-hit");
    if (!hit) return;
    hit.addEventListener("click", function () {
      setStage(key, true);
    });
    hit.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setStage(key, true);
      }
    });
    hit.addEventListener("mouseenter", function () {
      setStage(key, true);
    });
  });

  if (!reduceMotion && stageKeys.length) {
    stageTimer = setInterval(function () {
      stageIndex = (stageIndex + 1) % stageKeys.length;
      setStage(stageKeys[stageIndex], false);
    }, 4200);
  }

  /* —— Ambient particle field (ledger dust) —— */
  var canvas = document.getElementById("fx");
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var w = 0;
    var h = 0;
    var mx = -9999;
    var my = -9999;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.floor((w * h) / 12000);
      particles = [];
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.3,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.12,
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(196, 120, 74, 0.35)";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = p.x - mx;
        var dy = p.y - my;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          p.vx += (dx / (dist + 0.1)) * 0.035;
          p.vy += (dy / (dist + 0.1)) * 0.035;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // sparse links
      ctx.strokeStyle = "rgba(196, 120, 74, 0.06)";
      ctx.lineWidth = 1;
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a];
          var pb = particles[b];
          var ddx = pa.x - pb.x;
          var ddy = pa.y - pb.y;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < 9000) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener(
      "pointermove",
      function (e) {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );
    resize();
    requestAnimationFrame(tick);
  }

  
  /* —— Hero parallax (marketing only) —— */
  var heroPhoto = document.getElementById("hero-photo");
  var heroSection = document.querySelector(".hero");
  if (heroPhoto && heroSection && !reduceMotion) {
    var hx = 0, hy = 0, tx = 0, ty = 0;
    heroSection.addEventListener(
      "pointermove",
      function (e) {
        var r = heroSection.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 18;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 12;
      },
      { passive: true }
    );
    heroSection.addEventListener("pointerleave", function () {
      tx = 0;
      ty = 0;
    });
    (function parallax() {
      hx += (tx - hx) * 0.06;
      hy += (ty - hy) * 0.06;
      heroPhoto.style.transform =
        "translate(" + (-hx - 4) + "%, " + (-hy - 4) + "%) scale(1.08)";
      requestAnimationFrame(parallax);
    })();
  }

  /* —— Scroll reveal tiles —— */
  var tiles = document.querySelectorAll(".tile.is-out");
  if (tiles.length && "IntersectionObserver" in window) {
    if (reduceMotion) {
      tiles.forEach(function (t) {
        t.classList.remove("is-out");
        t.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add("is-in");
              en.target.classList.remove("is-out");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      tiles.forEach(function (t) {
        io.observe(t);
      });
    }
  }

  /* —— Stronger particle attract + density —— */

  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

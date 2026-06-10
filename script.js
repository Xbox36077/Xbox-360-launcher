(function() {
  // --- Utilities & state ---
  let currentTile = null;
  const storedImagesKey = 'xboxTileImages';
  const storedVideosKey = 'xboxTileVideos';
  const storedLinksKey  = 'xboxTileLinks';

  const storedImages = JSON.parse(localStorage.getItem(storedImagesKey) || '{}');
  const storedVideos = JSON.parse(localStorage.getItem(storedVideosKey) || '{}');
  const storedLinks  = JSON.parse(localStorage.getItem(storedLinksKey) || '{}');

  // Create video modal dynamically
  function ensureVideoModal() {
    if (document.getElementById('videoModal')) return;
    const modal = document.createElement('div');
    modal.id = 'videoModal';
    modal.style.cssText = `
      position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
      background: rgba(0,0,0,0.95); z-index: 12000; padding: 10px;
    `;
    modal.innerHTML = `
      <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
        <button id="videoModalClose" style="position:absolute; top:18px; right:18px; z-index:13000; background:#222; color:#fff; border:none; padding:10px 14px; border-radius:6px; cursor:pointer;">Close</button>
        <video id="videoModalPlayer" controls playsinline webkit-playsinline style="max-width:100%; max-height:100%; outline:none;"></video>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'none';

    document.getElementById('videoModalClose').addEventListener('click', closeVideoModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeVideoModal();
    });
  }

  function openVideoModal(src, isDataUrl) {
    ensureVideoModal();
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoModalPlayer');
    player.pause();
    player.removeAttribute('src');
    player.src = src;
    player.currentTime = 0;
    try { player.muted = false; } catch(e){}
    modal.style.display = 'flex';
    player.play().catch(()=>{});
  }

  function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (!modal) return;
    const player = document.getElementById('videoModalPlayer');
    if (player) { player.pause(); player.removeAttribute('src'); }
    modal.style.display = 'none';
  }

  // --- Tile initialization & Media Loader ---
  function initializeTiles() {
    document.querySelectorAll('.tile-item').forEach((tile, idx) => {
      if (!tile.dataset.tileId) {
        const panel = tile.closest('.global-panel-list-item');
        const pid = panel ? panel.id : 'panel';
        const index = Array.from(tile.parentNode.children).indexOf(tile);
        tile.dataset.tileId = `${pid}_tile_${index}`;
      }
      if (!tile.hasAttribute('tabindex')) {
        tile.setAttribute('tabindex', '-1');
      }
    });
  }

  function loadStoredMedia() {
    for (const id in storedImages) {
      const t = document.querySelector(`[data-tile-id="${id}"]`);
      if (t && storedImages[id]) {
        t.style.backgroundImage = `url(${storedImages[id]})`;
        t.style.backgroundSize = 'cover';
        t.style.backgroundPosition = 'center';
        t.style.backgroundColor = 'transparent';
      }
    }
    for (const id in storedVideos) {
      const t = document.querySelector(`[data-tile-id="${id}"]`);
      if (t && storedVideos[id]) {
        t.dataset.video = storedVideos[id];
        addVideoBadge(t);
      }
    }
    for (const id in storedLinks) {
      const t = document.querySelector(`[data-tile-id="${id}"]`);
      if (t && storedLinks[id]) {
        t.dataset.link = storedLinks[id];
      }
    }
  }

  function addVideoBadge(tile) {
    let badge = tile.querySelector('.video-play-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'video-play-badge';
      badge.style.cssText = `
        position:absolute; inset:auto auto 8% 8%; width:56px; height:56px;
        background: rgba(0,0,0,0.5); border-radius:50%; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:22px; z-index:5; pointer-events:none;
      `;
      badge.innerHTML = '&#9658;';
      tile.style.position = 'relative';
      tile.appendChild(badge);
    }
  }

  // --- Context Menu System ---
  function showContextMenu(x, y, tile) {
    hideContextMenu();
    currentTile = tile;
    const menu = document.createElement('div');
    menu.id = 'tileContextMenu';
    menu.style.cssText = `
      position: fixed; left:${x}px; top:${y}px; z-index:10000; background:#2c2c2c;
      border:1px solid #555; border-radius:6px; padding:6px 0; min-width:200px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.6);
    `;
    const items = [
      { text: 'Set Image from Gallery', fn: showImageGallery },
      { text: 'Upload New Media', fn: showUploadModal },
      { text: 'Remove Image/Video', fn: removeTileMedia },
      { text: 'Link via URL / Website', fn: uploadViaURL }
    ];
    items.forEach(it=> {
      const el = document.createElement('div');
      el.textContent = it.text;
      el.style.cssText = 'padding:10px 14px; color:#fff; cursor:pointer; font-family:Exo, sans-serif;';
      el.onmouseover = ()=> el.style.background = '#75bb3e';
      el.onmouseout = ()=> el.style.background = 'transparent';
      el.onclick = ()=> { it.fn(); hideContextMenu(); };
      menu.appendChild(el);
    });
    document.body.appendChild(menu);
  }

  function hideContextMenu() {
    document.getElementById('tileContextMenu')?.remove();
  }

  function removeTileMedia() {
    if (!currentTile) return;
    const id = currentTile.dataset.tileId;
    if (!id) return;
    delete storedImages[id]; delete storedVideos[id]; delete storedLinks[id];
    localStorage.setItem(storedImagesKey, JSON.stringify(storedImages));
    localStorage.setItem(storedVideosKey, JSON.stringify(storedVideos));
    localStorage.setItem(storedLinksKey, JSON.stringify(storedLinks));
    currentTile.style.backgroundImage = '';
    currentTile.style.backgroundColor = '#75bb3e';
    currentTile.removeAttribute('data-link');
    currentTile.removeAttribute('data-video');
    currentTile.querySelector('.video-play-badge')?.remove();
  }

  function showUploadModal() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) modal.style.display = 'flex';
  }

  function showImageGallery() {
    const galleryModal = document.getElementById('imageGalleryModal');
    if (!galleryModal) return;
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';

    for (const id in storedImages) {
      const imageData = storedImages[id];
      const item = document.createElement('div');
      item.style.cssText = `background-image: url(${imageData}); background-size:cover; background-position:center; aspect-ratio:1; border-radius:6px; cursor:pointer; border:2px solid transparent;`;
      item.onclick = ()=> { applyImageToCurrentTile(imageData); galleryModal.style.display = 'none'; };
      item.onmouseover = ()=> item.style.borderColor = '#75bb3e';
      item.onmouseout = ()=> item.style.borderColor = 'transparent';
      galleryGrid.appendChild(item);
    }
    galleryModal.style.display = 'block';
  }

  function applyImageToCurrentTile(imageData) {
    if (!currentTile) return;
    const id = currentTile.dataset.tileId || generateTileId(currentTile);
    storedImages[id] = imageData;
    delete storedVideos[id]; delete storedLinks[id];
    localStorage.setItem(storedImagesKey, JSON.stringify(storedImages));
    localStorage.setItem(storedVideosKey, JSON.stringify(storedVideos));
    localStorage.setItem(storedLinksKey, JSON.stringify(storedLinks));
    currentTile.style.backgroundImage = `url(${imageData})`;
    currentTile.style.backgroundSize = 'cover';
    currentTile.style.backgroundPosition = 'center';
    currentTile.style.backgroundColor = 'transparent';
    currentTile.querySelector('.video-play-badge')?.remove();
  }

  function applyVideoToCurrentTile(videoSrc) {
    if (!currentTile) return;
    const id = currentTile.dataset.tileId || generateTileId(currentTile);
    storedVideos[id] = videoSrc;
    delete storedImages[id]; delete storedLinks[id];
    localStorage.setItem(storedVideosKey, JSON.stringify(storedVideos));
    localStorage.setItem(storedImagesKey, JSON.stringify(storedImages));
    localStorage.setItem(storedLinksKey, JSON.stringify(storedLinks));
    currentTile.dataset.video = videoSrc;
    addVideoBadge(currentTile);
    currentTile.style.backgroundImage = '';
    currentTile.style.backgroundColor = '#111';
  }

  function generateTileId(tile) {
    const panel = tile.closest('.global-panel-list-item');
    const panelId = panel ? panel.id : 'unknown';
    const tileIndex = Array.from(tile.parentNode.children).indexOf(tile);
    tile.dataset.tileId = `${panelId}_tile_${tileIndex}`;
    return tile.dataset.tileId;
  }

  function uploadViaURL() {
    if (!currentTile) return;
    const input = prompt('Enter image/video URL or website link:');
    if (!input) return;
    const lower = input.toLowerCase().split('?')[0].split('#')[0];
    if (lower.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
      applyVideoToCurrentTile(input);
    } else if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      applyImageToCurrentTile(input);
    } else if (input.startsWith('http')) {
      const id = currentTile.dataset.tileId || generateTileId(currentTile);
      storedLinks[id] = input;
      localStorage.setItem(storedLinksKey, JSON.stringify(storedLinks));
      currentTile.dataset.link = input;
    }
  }

  // --- Document Event Bindings ---
  document.addEventListener('DOMContentLoaded', () => {
    initializeTiles();
    loadStoredMedia();
    ensureVideoModal();
  });

  document.getElementById('confirmUpload')?.addEventListener('click', () => {
    const fileInput = document.getElementById('imageUploadInput');
    if (!fileInput?.files?.[0]) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      if (file.type.startsWith('video/')) applyVideoToCurrentTile(e.target.result);
      else if (file.type.startsWith('image/')) applyImageToCurrentTile(e.target.result);
      document.getElementById('imageUploadModal').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('cancelUpload')?.addEventListener('click', () => {
    document.getElementById('imageUploadModal').style.display = 'none';
  });

  document.getElementById('closeGallery')?.addEventListener('click', () => {
    document.getElementById('imageGalleryModal').style.display = 'none';
  });

  document.getElementById('uploadNewImage')?.addEventListener('click', () => {
    showUploadModal();
  });

  document.addEventListener('contextmenu', function(e) {
    const t = e.target.closest('.tile-item');
    if (!t) return;
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, t);
  });

  document.addEventListener('click', function(e) {
    const tile = e.target.closest('.tile-item');
    if (e.target.closest('#tileContextMenu')) return;
    hideContextMenu();

    if (tile) {
      const vid = tile.dataset.video;
      if (vid) { openVideoModal(vid, vid.startsWith('data:')); return; }
      const link = tile.dataset.link;
      if (link) { window.open(link, '_blank'); return; }
      
      tile.style.backgroundColor = '#3a6bba';
      setTimeout(() => tile.style.backgroundColor = '#75bb3e', 300);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { hideContextMenu(); closeVideoModal(); }
  });

})();

// ==================== BING FIX SYSTEM (OPEN IN NEW TAB) ====================
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const bingForm = document.getElementById('bingForm');
    const bingInput = document.getElementById('bingSearchInput');

    if (bingForm && bingInput) {
      bingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = bingInput.value.trim();
        if (query) {
          // Force Open in absolute safe New Tab to keep the dashboard intact
          const url = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
          window.open(url, '_blank');
        }
      });
    }
  });
})();

// ==================== XBOX 360 BOOT VIDEO ====================
document.addEventListener('DOMContentLoaded', () => {
  const bootOverlay = document.getElementById('bootOverlay');
  const bootVideo = document.getElementById('bootVideo');
  const startBootBtn = document.getElementById('startBootBtn');

  if (startBootBtn && bootOverlay && bootVideo) {
    startBootBtn.addEventListener('click', () => {
      startBootBtn.style.display = 'none';
      bootVideo.style.display = 'block';
      bootVideo.muted = false;
      bootVideo.play().catch(() => {
        bootOverlay.style.display = 'none';
      });
    });

    bootVideo.addEventListener('ended', () => {
      bootOverlay.style.transition = 'opacity 0.5s ease';
      bootOverlay.style.opacity = '0';
      setTimeout(() => { bootOverlay.style.display = 'none'; }, 500);
    });
  }
});

// ==================== AVATAR SYSTEM ====================
document.addEventListener("DOMContentLoaded", () => {
    const avatar = document.getElementById("profileAvatar");
    const avatarImage = document.getElementById("avatarImage");
    const avatarUpload = document.getElementById("avatarUpload");

    if (!avatar || !avatarImage || !avatarUpload) return;

    const savedAvatar = localStorage.getItem("xboxProfileAvatar");
    if (savedAvatar) avatarImage.src = savedAvatar;

    avatar.addEventListener("click", () => avatarUpload.click());
    avatarUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file || file.size > 2 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            avatarImage.src = event.target.result;
            localStorage.setItem("xboxProfileAvatar", event.target.result);
        };
        reader.readAsDataURL(file);
    });
});

// ==================== CLOCK SYSTEM ====================
(function(){
  function updateClock() {
      const timeEl = document.getElementById('time');
      if (!timeEl) return;
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = `${hours}:${mins}`;
  }
  updateClock();
  setInterval(updateClock, 1000);
})();
          // विंडो लोड होते ही तुरंत काम शुरू करें
window.addEventListener('load', () => {
    const xboxNotif = document.getElementById('xboxNotif');
    const xboxImgUpload = document.getElementById('xboxImgUpload');
    const logoPreview = document.getElementById('logoPreview');

    // 1. चेक करो कि क्या यूजर ने कोई इमेज सेव की है
    try {
        const savedImage = localStorage.getItem('xboxUserLogo');
        if (savedImage) {
            logoPreview.src = savedImage;
        }
    } catch (e) {
        console.log("लोकल स्टोरेज एक्सेस ब्लॉक है, डिफ़ॉल्ट इमेज लोड होगी।");
    }

    // 2. होम स्क्रीन आने के 2 सेकंड बाद पॉप-अप को ऊपर लाओ
    setTimeout(() => {
        if (xboxNotif) {
            xboxNotif.classList.add('show');
        }

        // ⏱️ पूरे 30 सेकंड (30000ms) तक स्क्रीन पर रोकने के बाद ही वापस नीचे छुपाओ
        setTimeout(() => {
            if (xboxNotif) {
                xboxNotif.classList.remove('show');
            }
        }, 30000); 

    }, 2000);

    // 3. इमेज अपलोड करने और उसे पक्के तौर पर सेव करने का लॉजिक
    if (xboxImgUpload) {
        xboxImgUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    logoPreview.src = imageData;
                    
                    try {
                        localStorage.setItem('xboxUserLogo', imageData);
                    } catch (err) {
                        console.log("इमेज स्क्रीन पर बदल गई है, पर ब्राउज़र सिक्योरिटी के कारण परमानेंट सेव नहीं हो सकी।");
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }
});
window.addEventListener('load', () => {
    const xboxNotif = document.getElementById('xboxNotif');
    const xboxImgUpload = document.getElementById('xboxImgUpload');
    const logoPreview = document.getElementById('logoPreview');
    const xboxSound = document.getElementById('xboxSound'); // साउंड एलिमेंट

    // 1. अगर पहले से कोई इमेज सेव है, तो उसे लोड करो
    try {
        const savedImage = localStorage.getItem('xboxUserLogo');
        if (savedImage) {
            logoPreview.src = savedImage;
        }
    } catch (e) {
        console.log("लोकल स्टोरेज एक्सेस ब्लॉक है।");
    }

    // 2. होम स्क्रीन आने के 2 सेकंड बाद पॉप-अप आएगा और साउंड बजेगा
    setTimeout(() => {
        if (xboxNotif) {
            xboxNotif.classList.add('show'); // पॉप-अप ऊपर आया
            
            // 🔊 जैसे ही पॉप-अप दिखेगा, साउंड यहाँ प्ले होगा
            if (xboxSound) {
                xboxSound.play().catch(error => {
                    console.log("ब्राउज़र ने बिना क्लिक किए साउंड ब्लॉक किया, स्क्रीन पर कहीं भी टच करें:", error);
                });
            }
        }

        // ⏱️ पूरे 30 सेकंड तक रुकने के बाद वापस नीचे छुपाओ
        setTimeout(() => {
            if (xboxNotif) {
                xboxNotif.classList.remove('show');
            }
        }, 30000); 

    }, 2000);

    // 3. इमेज अपलोड और सेव करने का लॉजिक
    if (xboxImgUpload) {
        xboxImgUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    logoPreview.src = imageData;
                    try {
                        localStorage.setItem('xboxUserLogo', imageData);
                    } catch (err) {
                        console.log("इमेज सेव नहीं हो सकी।");
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

// ==================== XBOX 360 BOOT VIDEO & FIXED POP-UP SYSTEM ====================
document.addEventListener('DOMContentLoaded', () => {
    const bootOverlay = document.getElementById('bootOverlay');
    const bootVideo = document.getElementById('bootVideo');
    const startBootBtn = document.getElementById('startBootBtn');
    const xboxNotif = document.getElementById('xboxNotif');
    const logoPreview = document.getElementById('logoPreview');
    const xboxImgUpload = document.getElementById('xboxImgUpload');

    // 1. Storage se user image load karna
    try {
        const savedImage = localStorage.getItem('xboxUserLogo');
        if (savedImage && logoPreview) { logoPreview.src = savedImage; }
    } catch (e) {}

    // 2. Click karne par video play hoga
    if (startBootBtn && bootOverlay && bootVideo) {
        startBootBtn.addEventListener('click', () => {
            startBootBtn.style.display = 'none'; 
            bootVideo.style.display = 'block';  
            bootVideo.muted = false;
            bootVideo.play().catch(() => {
                bootOverlay.style.display = 'none';
                showXboxNotification();
            });
        });

        // Video khatam hone par dashboard khulega aur fixed sound chalega
        bootVideo.addEventListener('ended', () => {
            bootOverlay.style.transition = 'opacity 0.5s ease';
            bootOverlay.style.opacity = '0';
            setTimeout(() => { 
                bootOverlay.style.display = 'none'; 
                showXboxNotification(); 
            }, 500);
        });
    }

    // 🔔 SIGN-IN POP-UP SOUND FIXED (Sirf achievement sound chalega)
    function showXboxNotification() {
        const mainSound = document.getElementById('xboxSound'); 
        if (xboxNotif) {
            xboxNotif.classList.add('show');
            if (mainSound) {
                mainSound.pause();
                mainSound.currentTime = 0;
                mainSound.play().catch(error => console.log("Sound blocked"));
            }
        }
        setTimeout(() => {
            if (xboxNotif) { xboxNotif.classList.remove('show'); }
        }, 30000);
    }

    // Image Upload Logic
    if (xboxImgUpload && logoPreview) {
        xboxImgUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    logoPreview.src = e.target.result;
                    try { localStorage.setItem('xboxUserLogo', e.target.result); } catch (err) {}
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

// ==================== 🎮 FIXED LEFT/RIGHT SOUND SYSTEM (No Conflicts) ====================
// Jab page such mein badlega tabhi sound bajega, chahe key se badle ya touch se
$(document).ready(function() {
    let lastActiveId = $(".global-nav-list-item-link.-active").attr("href");

    // Ek unique observer lagayenge jo tab chalega jab active tab switch hoga
    setInterval(() => {
        const currentActiveId = $(".global-nav-list-item-link.-active").attr("href");
        
        if (currentActiveId && currentActiveId !== lastActiveId) {
            const sLeft = document.getElementById('soundLeft');
            const sRight = document.getElementById('soundRight');

            // Nav list ke basis par determine karenge ki movement left hui ya right
            const navLinks = $(".global-nav-list-item-link").map(function() { return $(this).attr("href"); }).get();
            const oldIdx = navLinks.indexOf(lastActiveId);
            const newIdx = navLinks.indexOf(currentActiveId);

            if (newIdx > oldIdx) {
                // Right move hua
                if (sRight) { sRight.pause(); sRight.currentTime = 0; sRight.play().catch(e => {}); }
            } else if (newIdx < oldIdx) {
                // Left move hua
                if (sLeft) { sLeft.pause(); sLeft.currentTime = 0; sLeft.play().catch(e => {}); }
            }
            lastActiveId = currentActiveId;
        }
    }, 150);
});

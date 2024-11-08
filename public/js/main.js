document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the thank you page
    if (window.location.pathname === '/thank-you') {
      // Get the store URL from localStorage
      const storeUrl = localStorage.getItem('storeUrl');
      if (storeUrl) {
        // Clear the stored URL
        localStorage.removeItem('storeUrl');
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = storeUrl;
        }, 3000);
      }
    }
  
    // Add click handlers for store links
    const storeLinks = document.querySelectorAll('a[data-store-url]');
    storeLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Store the target URL
        localStorage.setItem('storeUrl', this.dataset.storeUrl);
      });
    });
  });
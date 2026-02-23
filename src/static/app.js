document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section with delete buttons
        const participants = details.participants || [];
        let participantsHtml = '<div class="participants"><h5>Participants</h5>';
        if (participants.length === 0) {
          participantsHtml += '<p class="no-participants">No participants yet</p>';
        } else {
          participantsHtml += '<ul class="participants-list">';
          participants.forEach((p) => {
            participantsHtml += `<li data-email="${p}"><span class="participant-email">${p}</span><button class="participant-delete" title="Remove participant">×</button></li>`;
          });
          participantsHtml += '</ul>';
        }
        participantsHtml += '</div>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for participant remove buttons
        const deleteButtons = activityCard.querySelectorAll('.participant-delete');
        deleteButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const li = e.target.closest('li');
            const email = li.getAttribute('data-email');

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );

              const result = await res.json();

              if (res.ok) {
                // remove the list item from DOM
                li.remove();

                // update availability text
                const availability = activityCard.querySelector('.availability');
                const currentMatch = availability.textContent.match(/(\d+) spots left/);
                if (currentMatch) {
                  const current = parseInt(currentMatch[1], 10);
                  availability.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
                }

                // if list is now empty, show empty state
                const ul = activityCard.querySelector('.participants-list');
                if (!ul || ul.children.length === 0) {
                  const participantsDiv = activityCard.querySelector('.participants');
                  if (participantsDiv) {
                    participantsDiv.innerHTML = '<h5>Participants</h5><p class="no-participants">No participants yet</p>';
                  }
                }
              } else {
                console.error('Failed to remove participant:', result);
                // Optionally show a message
              }
            } catch (err) {
              console.error('Error removing participant:', err);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh the activities UI so the new participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

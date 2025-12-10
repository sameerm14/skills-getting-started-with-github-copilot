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

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select so we don't append duplicate options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants list (show empty state if none)
        const participantsHtml =
          details.participants && details.participants.length
            ? details.participants
                .map((participant) => {
                  const initials = (participant || "")
                    .split(" ")
                    .map(s => s[0] || "")
                    .join("")
                    .slice(0,2)
                    .toUpperCase();
                  // include a delete button next to each participant
                  return `<li class="participant-item" data-email="${participant}"><span class="avatar" aria-hidden="true">${initials}</span><span class="name">${participant}</span><button class="delete-participant" data-activity="${name}" data-email="${participant}" aria-label="Unregister ${participant}">🗑️</button></li>`;
                })
                .join("")
            : `<li class="empty">No participants yet</li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p class="participants-title"><strong>Participants:</strong></p>
          <ul class="participant-list" aria-label="Participants for ${name}">
            ${participantsHtml}
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for participants in this card
        activityCard.querySelectorAll(".delete-participant").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                { method: "POST" }
              );

              const json = await res.json();
              if (res.ok) {
                // refresh the activities display so counts and lists update
                await fetchActivities();

                messageDiv.textContent = json.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");

                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 4000);
              } else {
                messageDiv.textContent = json.detail || "Failed to unregister";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (error) {
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering:", error);
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
        // refresh activities so the new participant appears immediately
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

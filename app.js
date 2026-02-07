const statusEl = document.getElementById("status");
const listEl = document.getElementById("headline-list");

const COUNTY_CENTER = [45.0, -85.9];
const map = L.map("map", { scrollWheelZoom: false }).setView(COUNTY_CENTER, 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const placeIndex = [
  { name: "Leland", coords: [45.0236, -85.7595] },
  { name: "Suttons Bay", coords: [44.9778, -85.6486] },
  { name: "Northport", coords: [45.1307, -85.6187] },
  { name: "Glen Arbor", coords: [44.9061, -85.9931] },
  { name: "Empire", coords: [44.8125, -86.0614] },
  { name: "Cedar", coords: [44.8613, -85.7942] },
  { name: "Maple City", coords: [44.8536, -85.9945] },
  { name: "Lake Leelanau", coords: [44.9589, -85.7039] },
  { name: "Omena", coords: [45.0229, -85.5831] },
  { name: "Bingham Township", coords: [45.027, -85.8824] },
  { name: "Leelanau State Park", coords: [45.2013, -85.5856] },
];

const markerLayer = L.layerGroup().addTo(map);

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeTitle = (title) => title.toLowerCase();

const matchPlace = (title) => {
  const normalized = normalizeTitle(title);
  return placeIndex.find((place) => normalized.includes(place.name.toLowerCase()));
};

const hoursBetween = (date) => {
  const now = new Date();
  return (now - date) / 36e5;
};

const buildCard = (article, place, dateLabel) => {
  const card = document.createElement("article");
  card.className = "headline-card";

  const link = document.createElement("a");
  link.href = article.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = article.title;

  const meta = document.createElement("div");
  meta.className = "headline-meta";

  const source = document.createElement("span");
  source.textContent = article.domain || "Unknown source";

  const time = document.createElement("span");
  time.textContent = dateLabel;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = place ? `Near ${place.name}` : "Leelanau County";

  meta.append(source, time, badge);
  card.append(link, meta);
  return card;
};

const addMarker = (article, place, dateLabel) => {
  const coords = place ? place.coords : COUNTY_CENTER;
  const marker = L.marker(coords).addTo(markerLayer);
  const locationLabel = place ? place.name : "Leelanau County";
  marker.bindPopup(
    `<strong>${article.title}</strong><br />${locationLabel}<br /><a href="${article.url}" target="_blank" rel="noreferrer">Read article</a><br /><small>${dateLabel}</small>`
  );
};

const fetchArticles = async () => {
  const query = encodeURIComponent("Leelanau County Michigan");
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=50&sort=DateDesc`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to reach GDELT");
  }
  const data = await response.json();
  return data.articles || [];
};

const render = async () => {
  try {
    const articles = await fetchArticles();
    markerLayer.clearLayers();
    listEl.innerHTML = "";

    const recent = articles.filter((article) => {
      const date = new Date(article.seendate);
      return hoursBetween(date) <= 24;
    });

    if (recent.length === 0) {
      statusEl.textContent = "No headlines in the last 24 hours. Check back soon!";
      return;
    }

    statusEl.textContent = `Showing ${recent.length} stories from the last 24 hours.`;

    recent.forEach((article) => {
      const place = matchPlace(article.title || "");
      const dateLabel = formatDate(article.seendate);
      addMarker(article, place, dateLabel);
      listEl.append(buildCard(article, place, dateLabel));
    });
  } catch (error) {
    statusEl.textContent = "Unable to load the news right now.";
    listEl.innerHTML = "<p>Check your connection and refresh the page.</p>";
    console.error(error);
  }
};

render();

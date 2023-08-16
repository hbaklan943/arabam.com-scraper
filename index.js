const puppeteer = require("puppeteer");
const fs = require("fs");

let rangeOfPages = [1, 50];
let url = `https://www.arabam.com/ikinci-el/otomobil/honda-civic-1-6-i-vtec?page=1`;

async function scrape() {
  const browser = await puppeteer.launch({ headless: "new" }); // Change headless value to false for debugging

  const page = await browser.newPage();

  page.on("console", (message) => {
    console.log(`Page Console Log: ${message.text()}`);
  });

  let fileName = "50_pages_scored.csv";
  let stream = fs.createWriteStream(fileName, { flags: "a" });
  // Define CSV header
  const csvHeader = [
    "Model",
    "Ilan Basligi",
    "Yil",
    "Kilometre",
    "Renk",
    "Fiyat",
    "Tarih",
    "Il/Ilce",
    "Puan",
  ];
  stream.write(csvHeader.join(","));
  stream.write("\n");
  for (let i = rangeOfPages[0]; i <= rangeOfPages[1]; i++) {
    try {
      await page.goto(
        `https://www.arabam.com/ikinci-el/otomobil/honda-civic-1-6-i-vtec?page=${i}`
      );
      await page.setViewport({ width: 1080, height: 1024 });
      console.log("Page visited");
    } catch (error) {
      console.error(error);
    }

    try {
      await page.waitForSelector("table", { timeout: 90000 });
      console.log("Table found");

      // Extract table data excluding the ad row
      const tableData = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll(
            "table tbody tr.listing-list-item.pr.should-hover.bg-white"
          )
        );
        return rows.map((row) => {
          let puan = 0;
          let columns = Array.from(row.querySelectorAll("td")).map((cell) =>
            cell.innerText.trim()
          );
          const ilIlce = columns.pop(); // Remove the last element from the array (Il/Ilce)
          columns.push(ilIlce.replace(/\n/g, "/")); // Replace newline with a slash
          puan =
            Number(columns[3]) * 3 -
            Number(columns[4]) * 3 -
            Number(columns[6].replace(/[^\d]/g, "")) / 1000; // Generate score

          columns.push(puan);
          if (columns.length === 9) {
            columns = [...columns.slice(0, 5), "--", ...columns.slice(5)]; // Sometimes "Renk" value is missing on table row replace it with "--"
          }
          console.log(`Saved a row`);
          return columns.slice(1); // Remove the first empty element
        });
      });

      // Create a CSV string
      const csvData = tableData.map((row) => row.join(","));

      stream.write(csvData.join("\n"));
      stream.write("\n");

      console.log(`A page of table data appended to ${fileName}`);
    } catch (error) {
      console.error(error);
    }
  }

  stream.end();
  await browser.close();
}

scrape();

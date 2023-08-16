const puppeteer = require("puppeteer");
const fs = require("fs");

let pageCount = 50;
let url = `https://www.arabam.com/ikinci-el/otomobil/honda-civic-1-6-i-vtec?page=1`;

async function scrape() {
  const browser = await puppeteer.launch({ headless: false }); // Change headless value to false for debugging

  const page = await browser.newPage();

  page.on("console", (message) => {
    console.log(`Page Console Log: ${message.text()}`);
  });

  let stream = fs.createWriteStream("50_puanli.csv", { flags: "a" });
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
  for (let i = 1; i <= pageCount; i++) {
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
            puan +
            Number(columns[3]) * 3 -
            Number(columns[4]) * 3 -
            Number(columns[6].replace(/[^\d]/g, "")) / 1000;
          //console.log(puan);
          columns.push(puan);
          console.log(columns.length);
          if (columns.length === 9) {
            columns = [...columns.slice(0, 5), "--", ...columns.slice(5)];
          }
          return columns.slice(1); // Remove the first empty element
        });
      });

      // Create a CSV string
      const csvData = tableData.map((row) => row.join(","));

      // Save CSV to a file
      fs.writeFileSync("table_data.csv", csvData.join("\n"), "utf-8");

      stream.write(csvData.join("\n"));
      stream.write("\n");

      console.log("Table data saved to table_data.csv");
    } catch (error) {
      console.error(error);
    }
  }

  stream.end();
  await browser.close();
}

scrape();

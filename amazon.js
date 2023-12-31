const { chromium } = require("playwright");
const { expect } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.amazon.in/");
  await page.fill("#twotabsearchtextbox", "Samsung");
  await page.click("#nav-search-submit-button");
  await page.waitForTimeout(20000);

  let values = await page.$$eval(
    '//span[@class="a-size-medium a-color-base a-text-normal"]',
    (el) => {
      return el.map((e) => e.innerText);
    }
  );

  await page.waitForTimeout(20000);

  let trimmedTextArray = [];
  for (const element of values) {
    let item = {
      name: element,
      price: "",
      isPrime: false,
    };
    trimmedTextArray.push(item);
  }


  let costs = await page.$$eval('//span[@class="a-price-whole"]', (el) => {
    return el.map((e) => e.innerText);
  });

  for (i = 0; i < costs.length; i++) {
    trimmedTextArray[i].price = costs[i];
  }

  let nameArray = await page.$$eval(
    '//i[@class="a-icon a-icon-prime a-icon-medium"]//ancestor::div[@class="a-section a-spacing-small a-spacing-top-small"]//span[@class="a-size-medium a-color-base a-text-normal"]',
    (el) => {
      return el.map((e) => e.innerText);
    }
  );

  for (let item of trimmedTextArray) {
    // Check if the name exists in nameArray
    if (nameArray.includes(item.name)) {
      item.isPrime = true;
    }
  }


  const costlim = await page.$$eval(
    '//span[text()="Limited time deal"]//ancestor::div[@class="a-section a-spacing-none a-spacing-top-micro puis-price-instructions-style"]//span[@class="a-price"]',
    (el) => {
      return el.map((e) => e.innerText);
    }
  );

  const mname = await page.$$eval(
    '//span[text()="Limited time deal"]//ancestor::div[@class="puisg-row"]//preceding-sibling::div[@class="a-section a-spacing-none puis-padding-right-small s-title-instructions-style"]//h2[@class="a-size-mini a-spacing-none a-color-base s-line-clamp-2"]',
    (el) => {
      return el.map((e) => e.innerText);
    }
  );


  let array = [];
  for (i = 0; i < costlim.length; i++) {
    let selectedprice = costlim[i].split("\n")[0];
    selectedprice = selectedprice.replace(/[^0-9]/g, "");
    selectedprice = parseFloat(selectedprice);
    let item = {
      name: mname[i].replace("\n", " "),
      price: selectedprice,
    };
    array.push(item);
  }


  let maxPriceElement = array[0];
  for (let i = 1; i < array.length; i++) {
    if (array[i].price > maxPriceElement.price) {
      maxPriceElement = array[i];
    }
  }
  nameMaxPrice = maxPriceElement.name;

  const deal = await page.locator(
    `//div//h2[@class="a-size-mini a-spacing-none a-color-base s-line-clamp-2"]//a//span[contains(text(), "${nameMaxPrice}")]`
  );
  //await page.waitForTimeout(50000)

  await deal.click();

  const newWindowHandle = await page.waitForEvent("popup");
  await newWindowHandle.waitForLoadState();

  await newWindowHandle.waitForTimeout(1000);
  await newWindowHandle.click(
    '//div[@id="desktop_qualifiedBuyBox"]//span[@id="submit.add-to-cart"]'
  );

  await newWindowHandle.click(
    '//span[@id="attach-sidesheet-view-cart-button"]'
  );
  await newWindowHandle.waitForTimeout(5000)
  await newWindowHandle.locator('#quantity').selectOption('9')
  await newWindowHandle.waitForTimeout(5000)
  const subtotal = await newWindowHandle
    .locator('//span[@id="sc-subtotal-amount-buybox"]')
    .textContent();
  
  let result = {
    ...trimmedTextArray,
    subtotal: subtotal.trim(),
  };
  console.log(result);
  await browser.close();
  await page.close()
})();

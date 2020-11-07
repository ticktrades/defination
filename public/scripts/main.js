import { h, render } from "https://cdn.skypack.dev/preact";
import { useState, useEffect } from "https://cdn.skypack.dev/preact/hooks";
import htm from "https://cdn.skypack.dev/htm";

const html = htm.bind(h);

function Header() {
  return html`
    <header>
      <h1 id="logo">
        <a href="/">
          <img src="images/logos/logo-define.svg" />
        </a>
      </h1>
    </header>
  `;
}

function Footer() {
  return html`
    <footer>Ticktrades Define</footer>
  `;
}

function Main() {
  const [tickers, setTickers] = useState([]);
  const [tickerLoading, setTickerLoading] = useState(false);

  const [refetch, setRefetch] = useState(false);

  const [totalValueETH, setTotalValueETH] = useState(0);

  const [totalValueUSD, setTotalValueUSD] = useState(0);

  const [token, setToken] = useState("");

  function toggleRefetch() {
    setRefetch(!refetch);
  }

  async function fetchTicker() {
    if (!tickerLoading) {
      setTickerLoading(true);
      const option = {
        body: JSON.stringify({ token }),
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8"
        }
      };

      const res = await fetch("/api/ticker", option);

      const data = await res.json();
      const preprocessedData = data.tokens
        .filter(token => token.tokenInfo.price)
        .sort((current, next) => {
          const {
            price: priceCurrent,
            decimals: decimalsCurrent
          } = current.tokenInfo;

          const balanceCurrent =
            current.balance / Math.pow(10, decimalsCurrent);
          const priceUSDCurrent = priceCurrent.rate;
          const valueUSDCurrent = balanceCurrent * priceUSDCurrent;

          const {
            price: priceNext,
            decimals: decimalsNext
          } = next.tokenInfo;

          const balanceNext = next.balance / Math.pow(10, decimalsNext);
          const priceUSDNext = priceNext.rate;
          const valueUSDNext = balanceNext * priceUSDNext;

          return parseFloat(valueUSDNext) - parseFloat(valueUSDCurrent);
        })
        .map(token => {
          const { image, name, price, decimals } = token.tokenInfo;

          const balance = (token.balance / Math.pow(10, decimals));
          const priceUSD = price.rate;
          const rateETH = data.ETH.price.rate;
          const priceETH = priceUSD / rateETH;
          const valueUSD = balance * priceUSD;
          const valueETH = valueUSD / rateETH;
          return { balance: balance.toFixed(3), priceUSD: priceUSD.toFixed(4), priceETH: priceETH.toFixed(8), valueUSD: valueUSD.toFixed(3), valueETH: valueETH.toFixed(4), image, name }
        })
      setTickers(preprocessedData);
      setTotalValueETH(preprocessedData.reduce((previous, current) => {
        return { valueETH: parseFloat(previous.valueETH) + parseFloat(current.valueETH) }
      }, { valueETH: 0 }).valueETH);

      setTotalValueUSD(preprocessedData.reduce((previous, current) => {
        return { valueUSD: parseFloat(previous.valueUSD) + parseFloat(current.valueUSD) }
      }, { valueUSD: 0 }).valueUSD)
      setTickerLoading(false);
      //toggleRefetch();
    }
  }

  useEffect(async () => {
    if (refetch) {
      await fetchTicker();
    }
    //const interval = setInterval(toggleRefetch, 20000);
    //return () => clearInterval(interval);
  }, [refetch]);


  return html`
    <main>
      <form class="wallet-address"
        onSubmit=${event => {
      event.preventDefault();
      toggleRefetch();
    }}
      >
        <input
          type="text"
          onInput=${event => {
      setToken(event.currentTarget.value);
    }}
        /><button>Fetch</button>
      </form>
      ${(tickers.length > 0) ? (
      html`
        <section class="portfolio-summary">
          <article>
            <h2>Total Value (USD)</h2>
            ${totalValueUSD}
          </article>
          <article>
            <h2>Total Value (ETH)</h2>
            ${totalValueETH}
          </article>
        </section>
        <table class="wallet-detail">
          <thead>
            <tr>
              <th></th>
              <th>Asset</th>
              <th>Balance</th>
              <th>Price (in USD)</th>
              <th>Price (in ETH)</th>
              <th>Value (in USD)</th>
              <th>Value (in ETH)</th>
            </tr>
          </thead>
          <tbody>
            ${tickers.map(({ image, name, balance, priceUSD, priceETH, valueUSD, valueETH }) => {
        return html`
                  <tr>
                    <td>
                      ${image ? html`<img height="30" src="https://ethplorer.io${image}" />` : ''}
                    </td>
                    <td>${name}</td>
                    <td class="number">${balance}</td>
                    <td class="number">${priceUSD}</td>
                    <td class="number">${priceETH}</td>
                    <td class="number">${valueUSD}</td>
                    <td class="number">${valueETH}</td>
                  </tr>
                `;
      })}
          </tbody>
        </table>
    `
    ) : ''}
    </main>
  `;
}

function App() {
  return html`
    <${Header} /><${Main} /><${Footer} />
  `;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/service-worker.js").then(
        function (registration) {
          // Registration was successful
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
        },
        function (err) {
          // registration failed :(
          console.log("ServiceWorker registration failed: ", err);
        }
      );
    });
  }
}

function init() {
  render(
    html`
      <${App} />
    `,
    window.document.body
  );
  //registerServiceWorker();
}

init();

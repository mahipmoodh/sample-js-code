function Prooffly() {
  $("head").append(
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/13.0.2/css/intlTelInput.css" />'
  );
  if (account_isActive == "True") {
    /*  Detects url change  */
    const cell = isControlCell();
    if (getVisitorID() && cell === "false") {
      $(document).ready(() => matchUrlPattern());
      $(document).ready(() => calculateClickImpression("Page viewed"));
      $(document).ready(() => showMessage());
      $(document).ready(() => showSmsReminder());
    }
    lg("URL changed = " + window.location.href);

    /* Visitor ID containing */
    function Visitor(visitorID) {
      this.newVisitorID = visitorID;
      this.setVisitorID = function (newVisitorID) {
        Visitor.visitorID = newVisitorID;
        var date = new Date();
        date.setTime(date.getTime() + 180 * 24 * 60 * 60 * 1000); //6months
        var expires = "; expires=" + date.toGMTString();
        document.cookie = `visitorCookie=${newVisitorID}${expires} ; path=/`;
        lg("Visitor object updated:" + readCookie("visitorCookie"));
      };
    }
    /* Send visitor id */
    function sendVisitorID() {
      const pageList = pages && JSON.parse(pages);
      lg("pageList:" + pageList);
      const domainID = pageList[0] && pageList[0].domain;
      lg("domainID:" + domainID);
      const currentDomain = domainID && domainID.toString();
      currentDomain
        ? lg("Current domainID ID:" + domainID, currentDomain)
        : lg("domainID does not exist:");
      currentDomain &&
        $.ajax({
          type: "POST",
          url: `${baseURL}visitor_logs/create/`,
          headers: { Account: `${accountID}` },
          contentType: "application/json",
          dataType: "json",
          data: JSON.stringify({
            domain_uuid: currentDomain,
          }),
          success: function (response) {
            const temp = new Visitor();
            temp.setVisitorID(response.message.visitor_id);
            setControlCell(response.message.is_control_cell);
            if (response.message.is_control_cell === false) {
              $(document).ready(() => matchUrlPattern());
              $(document).ready(() => calculateClickImpression("Page viewed"));
              $(document).ready(() => showMessage());
              $(document).ready(() => showSmsReminder());
            }
            lg("Set visitor cookie true");
          },
          error: function (xhr, status, error) {
            console.log(xhr.error);
          },
        });
    }

    /* Check if new or exsiting Visitor */
    function getVisitorID() {
      var visitorID = readCookie("visitorCookie");
      if (visitorID !== null || visitorID !== "undefined") {
        return visitorID;
      }
      lg("Current Visitor ID:" + visitorID);
      return null;
    }

    /* Check visitor id exist and send request */
    $(document).ready(function () {
      const id = getVisitorID();
      id === null ? lg("ID does not exist") : lg(`Current id is-${id}`);
      lg(`Current pages are-${pages}`);
      id === null && sendVisitorID();
    });

    /* Set control cell */
    function setControlCell(cell) {
      var date = new Date();
      date.setTime(date.getTime() + 180 * 24 * 60 * 60 * 1000); //6months
      var expires = "; expires=" + date.toGMTString();
      document.cookie = `controlCell=${cell}${expires} ; path=/`;
      lg("Set Control Cell" + cell);
    }

    /* get control cell */
    function isControlCell() {
      ControlCellPercentage = readCookie("controlCell");
      if (
        ControlCellPercentage !== null ||
        ControlCellPercentage !== "undefined"
      ) {
        lg("Current ControlCellPercentage:" + ControlCellPercentage);
        return ControlCellPercentage;
      }
      return null;
    }

    /* generate regex for match_types  */
    function generateRegex(type, pattern) {
      this.type = type;
      this.patten = pattern;

      let result = "";
      if (pattern.includes("http")) {
        result = pattern.includes("https")
          ? pattern.slice(8, pattern.length)
          : pattern.slice(7, pattern.length);
        result = result.includes("www")
          ? result.slice(4, result.length)
          : result;
        result =
          result.indexOf("?") > 0
            ? result.slice(0, result.indexOf("?"))
            : result;
        result =
          result.charAt(result.length - 1) === "/"
            ? result.slice(0, result.length - 1)
            : result;
      } else if (
        pattern.includes("www") &&
        (!pattern.includes("http") || !pattern.includes("https"))
      ) {
        result = pattern.slice(4, pattern.length);
        result =
          result.indexOf("?") > 0
            ? result.slice(0, result.indexOf("?"))
            : result;
        result =
          result.charAt(result.length - 1) === "/"
            ? result.slice(0, result.length - 1)
            : result;
      } else if (
        !pattern.includes("www") &&
        !pattern.includes("http") &&
        !pattern.includes("https") &&
        type !== "substring_match" &&
        pattern.includes(".")
      ) {
        result =
          pattern.indexOf("?") > 0
            ? pattern.slice(0, result.indexOf("?"))
            : pattern;
        result =
          result.charAt(result.length - 1) === "/"
            ? result.slice(0, result.length - 1)
            : result;
      } else if (
        !pattern.includes("www") &&
        !pattern.includes("http") &&
        !pattern.includes("https") &&
        type !== "substring_match" &&
        !pattern.includes(".")
      ) {
        result = false;
      } else if (
        !pattern.includes("www") &&
        !pattern.includes("http") &&
        !pattern.includes("https") &&
        type !== "simple_match" &&
        pattern.includes(".")
      ) {
        result =
          pattern.indexOf("?") > 0
            ? pattern.slice(0, result.indexOf("?"))
            : pattern;
        result =
          result.charAt(result.length - 1) === "/"
            ? result.slice(0, result.length - 1)
            : result;
      } else if (
        !pattern.includes("www") &&
        !pattern.includes("http") &&
        !pattern.includes("https") &&
        type !== "simple_match" &&
        !pattern.includes(".")
      ) {
        result = pattern;
      }

      switch (type) {
        case "substring_match":
          this.pattern = new RegExp(
            `(?!(?:https|http):\/\/(?:www)(?:.))${result}`,
            "i"
          );
          break;
        case "simple_match":
          this.pattern =
            result &&
            new RegExp(
              `(?!(?:https|http):\/\/(?:www)(?:.))${result}(?=$|[/][?=?]|[?])`,
              "gm"
            );
          break;
        default:
          break;
      }
    }

    /**
       URL Object to match the current url with url pattern.
       @params:
            matchType: Simple | Substring | Exact | Regex
  */
    function URLObject(matchType, urlPattern, url) {
      this.matchType = matchType;
      this.urlPattern = urlPattern;

      var currentURL = url;
      var matchFound = false;

      lg("URLObject called");
      switch (matchType) {
        case "simple_match":
          const regex_1 = new generateRegex("simple_match", urlPattern);
          if (regex_1.pattern && regex_1.pattern.test(currentURL)) {
            matchFound = true;
          }
          break;
        case "substring_match":
          const regex_2 = new generateRegex("substring_match", urlPattern);
          if (regex_2.pattern && regex_2.pattern.test(currentURL)) {
            matchFound = true;
          }
          break;
        case "exact_match":
          if (currentURL === urlPattern) {
            matchFound = true;
          }
          break;
        case "regular_expression_match":
          const regex = new RegExp(`${urlPattern}`, "gm");
          if (regex.test(currentURL)) {
            matchFound = true;
          }
          break;
        case "regexp_match":
          const regex_match = new RegExp(`${urlPattern}`, "gm");
          if (regex_match.test(currentURL)) {
            matchFound = true;
          }
          break;
        default:
          break;
      }
      return matchFound;
    }

    /* Return absolute url without proofflylog query param */
    function getAbsoluteURL() {
      const url = document.URL;
      let absoluteURL = url;
      if (url.includes("proofflylog=true")) {
        const index = url.indexOf("proofflylog=true");
        absoluteURL = index ? url.slice(0, index - 1) : url;
      }
      return absoluteURL;
    }

    /* Match url pattern get result for multiple url patterns */
    function matchMultipleUrlPatterns(matchType, patterns, url) {
      let result = false;
      if (patterns.length > 1) {
        let i;
        for (i = 0; i < patterns.length; i++) {
          let urlTest = URLObject(
            patterns[i].match_type,
            patterns[i].url_pattern,
            url
          );
          if (urlTest) {
            result = urlTest;
            break;
          }
        }
      } else {
        result =
          matchType && URLObject(matchType, patterns[0].url_pattern, url);
      }
      return result;
    }
    /* Get events and match url pattern specific to page */
    function matchUrlPattern() {
      const url = getAbsoluteURL();
      const localEvents = JSON.parse(selectedEvents);
      const selectors = JSON.parse(productInfo);
      const pageEvents = JSON.parse(localStorage.getItem("pageEvents"));
      pages &&
        JSON.parse(pages).filter((item) => {
          if (item.page_url === url) {
            item.events && item.events[0] && localEvents.push(item.events);
          } else if (item.page_url !== url && item.url_pattern) {
            let result = false;
            if (item.url_pattern && item.url_pattern.length > 1) {
              let i;
              for (i = 0; i < item.url_pattern.length; i++) {
                let urlTest = URLObject(
                  item.url_pattern[i].match_type,
                  item.url_pattern[i].url_pattern,
                  url
                );
                if (urlTest) {
                  result = urlTest;
                  break;
                }
              }
            } else {
              result =
                item.match_type &&
                URLObject(
                  item.match_type,
                  item.url_pattern[0].url_pattern,
                  url
                );
            }
            item.events &&
              item.events[0] &&
              result &&
              localEvents.push(item.events);
          }
        });

      let productEvents = [];
      localEvents &&
        localEvents.map((events) => {
          events &&
            events.map((event) => {
              try {
                if (event.event_type === "product_Sku_Id") {
                  const js_variable =
                    event.js_var === true ? eval(event.value) : "";
                  productEvents.push({ ...event, js_variable });
                }
              } catch (error) {
                lg(
                  `Invalid variable name or variable does not exist for event type ${event.event_type}`
                );
              }
            });
        });
      if (pageEvents) {
        const isPresent =
          productEvents[0] &&
          pageEvents.filter((item) => {
            return productEvents.some(function (prodEvents) {
              return (
                item.id === prodEvents.id &&
                item.js_variable === prodEvents.js_variable
              );
            });
          });
        if (isPresent && !isPresent[0]) {
          //  get page uuid
          const pageid = getPageUuid();
          // add page uuid in page events
          const pageUUid = pageid ? pageid : "";
          productEvents[0]["page_uuid"] = pageUUid;
          pageEvents.push(productEvents[0]);
          localStorage.setItem("pageEvents", JSON.stringify(pageEvents));
        }
      } else {
        // select top product events
        let topProductEvent = productEvents[0];
        // get page uuid
        const pageid = getPageUuid();
        const pageUUid = pageid ? pageid : "";
        // add page uuid in page events
        topProductEvent["page_uuid"] = pageUUid;
        localStorage.setItem("pageEvents", JSON.stringify([topProductEvent]));
      }

      localEvents &&
        localEvents.map((item) => {
          item &&
            item.map((key) => {
              key.event_type !== "page_viewed" &&
                selectors.push({
                  [key.event_type]: key.value,
                  condition: key.condition,
                  js_variable: key.js_var,
                });
            });
        });
      lg(`selectedEvents for this page are - ${JSON.stringify(localEvents)}`);
      selectedEvents = JSON.stringify(localEvents);
      productInfo = JSON.stringify(selectors);
      selectors &&
        selectors.map((item) => {
          return Object.keys(item).map((event) => {
            return event !== "condition" && event !== "js_variable"
              ? getElementBySelector(item[event], event, item.condition, item)
              : null;
          });
        });
    }

    /**
  Get the element based on 'Selector'. This selector will be passed via settings
  */
    function getElementBySelector(selector, event, condition, item) {
      let customCondition = condition !== "on_page_load" && eval(condition);
      let result =
        typeof customCondition === "function" &&
        $(document).ready(() => customCondition());
      const checked = condition === "on_page_load";
      let element = "";
      try {
        if (checked && item["js_variable"] === false) {
          element = document.querySelectorAll(selector);
        } else if (item["js_variable"] === true) {
          element = eval(selector);
        }
        if (item["js_variable"] === true) {
          lg(`${event} found: ` + element);
        } else if (element && element[0] && element[0].innerText.length > 0) {
          lg(`${event} found: ` + element[0].innerText);
          return element[0].innerText;
        } else if (element) {
          lg(
            `event type ${event} with selector: ` +
              selector +
              " length not found"
          );
        } else if (!element) {
          lg(`event type ${event} return false for custom condition`);
        }
        if (event === "product_Sku_Id" && element) {
          localStorage.setItem("product_Sku_Id", element);
        }
      } catch (error) {
        item["js_variable"] === true
          ? lg(
              `Invalid variable or variable does not exist for event type ${event}`
            )
          : lg(`Invalid selector for event type ${event}`);
      }
      return null;
    }

    /* remove product event ids from local storage */
    function removeProductIds(uuid_key, product_id) {
      const pageEvents = JSON.parse(localStorage.getItem("pageEvents"));
      let localPageEvents = [];
      if (pageEvents) {
        localPageEvents = pageEvents.filter((item) => {
          if (item.uuid_key !== uuid_key) {
            return item;
          }
        });
        localStorage.setItem("pageEvents", JSON.stringify(localPageEvents));
        product_id &&
          lg(
            `productId ${product_id} removed from local storage after purchase`
          );
      }
    }

    /* ajax call for message displayed impression */
    function msgDisplayedImpression(item) {
      $.ajax({
        type: "POST",
        url: `${baseURL}impressions/message_campaign/create/`,
        headers: { Account: `${accountID}` },
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
          domain_id: JSON.stringify(item.page.domain_id),
          page_uuid: getPageUuid(),
          product_id: getSkuId(),
          message_campaign_uuid: item.uuid_key,
          visitor_id: getVisitorID(),
        }),
        success: function (response) {
          lg(`Message campaign displayed impression recorded`);
        },
        error: function (xhr, status, error) {
          lg(xhr.error);
        },
      });
    }

    /* get all live message campaign id */
    function getMessageCampaignId() {
      const localMsg = (messages && JSON.parse(messages)) || [];
      let messageIds = [];
      if (localMsg) {
        localMsg.map((item) => {
          if (
            item &&
            item.campaign_start_time !== null &&
            new Date(item.campaign_start_time) <= new Date()
          ) {
            if (
              (item.campaign_end_time !== null &&
                new Date(item.campaign_end_time) >= new Date()) ||
              item.campaign_end_time === null
            ) {
              messageIds.push(item.uuid_key);
            }
          } else {
            if (
              (item.campaign_end_time !== null &&
                new Date(item.campaign_end_time) >= new Date()) ||
              item.campaign_end_time === null
            ) {
              messageIds.push(item.uuid_key);
            }
          }
        });
      }
      return messageIds;
    }
    /* Get Product Sku Id */
    function getSkuId() {
      let productSkuId = "";
      const isPresent = localStorage.getItem("product_Sku_Id");
      if (isPresent) {
        productSkuId = isPresent;
      }
      return productSkuId;
    }

    /* Check is Page Uuid Available */
    function getPageUuid() {
      const allPage = (pages && JSON.parse(pages)) || [];
      let page_uuid = "";
      const url = getAbsoluteURL();
      const getPage =
        allPage &&
        allPage.length > 0 &&
        allPage.filter((pages) => {
          if (pages.page_url === url) {
            return true;
          }
        });
      if (getPage && getPage.length > 0) {
        page_uuid = getPage[0].uuid_key;
      }
      return page_uuid;
    }
    /* ajax call for click impression */
    function addImpressions(
      event,
      item,
      event_name,
      product_id,
      revenue,
      revenue_uuid
    ) {
      $.ajax({
        type: "POST",
        url: `${baseURL}impressions/create/`,
        headers: { Account: `${accountID}` },
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
          created_by: event.created_by,
          modified_by: event.modified_by,
          domain_id: JSON.stringify(item.domain),
          event_uuid: event.uuid_key,
          page_uuid: getPageUuid(),
          event_type: event.event_type,
          event_name: event.name,
          visitor_id: getVisitorID(),
          is_control_cell: isControlCell(),
          message_campaign_uuid: getMessageCampaignId(),
          product_id: getSkuId(),
        }),
        success: function (response) {
          removeProductIds(event.uuid_key, product_id);
          if (event_name == "Page viewed") {
            lg(`${event_name} - ${response.page_viewed} times`);
          } else if (event_name == "Product SKU / ID") {
            lg(`Product with id ${product_id} is purchased`);
          } else {
            lg(`${event_name} - clicked`);
          }
        },
        error: function (xhr, status, error) {
          lg(xhr.error);
        },
      });
    }

    /* ajax call to create / store revenue */
    function addRevenue(
      event,
      item,
      event_name,
      product_id,
      revenue,
      page_uuid
    ) {
      const msgCampaigns = (messages && JSON.parse(messages)) || [];
      const message_campaign_uuid = [];
      msgCampaigns &&
        msgCampaigns.map((item) => {
          if (item && item.uuid_key) {
            message_campaign_uuid.push(item.uuid_key);
          }
        });
      $.ajax({
        type: "POST",
        url: `${baseURL}revenues/create/`,
        headers: { Account: `${accountID}` },
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
          created_by: event.created_by,
          modified_by: event.modified_by,
          domain_id: JSON.stringify(item.domain),
          event_uuid: event.uuid_key,
          page_uuid: page_uuid,
          product_id: product_id ? product_id : getSkuId(),
          event_type: event.event_type,
          event_name: event.name,
          visitor_id: getVisitorID(),
          is_control_cell: isControlCell(),
          revenue: parseInt(revenue) || 0,
          message_campaign_uuid,
        }),
        success: function (response) {
          removeProductIds(event.uuid_key, product_id);
          if (event_name == "Page viewed") {
            lg(`${event_name} - ${response.page_viewed} times`);
          } else if (event_name == "Product SKU / ID") {
            lg(`Product with id ${product_id} is purchased`);
          } else {
            lg(`${event_name} - clicked`);
          }
        },
        error: function (xhr, status, error) {
          lg(xhr.error);
        },
      });
    }
    /* Calculate click impression */
    function calculateClickImpression(
      event_name,
      isTracking,
      product_id,
      uuid_key,
      revenue,
      page_uuid
    ) {
      const url = getAbsoluteURL();
      const currentPage = (pages && JSON.parse(pages)) || [];
      if (isTracking) {
        currentPage.filter((item) => {
          return item.events.filter((event) => {
            if (
              event.event_type === "product_Sku_Id" &&
              event.uuid_key == uuid_key
            ) {
              addRevenue(
                event,
                item,
                event.name,
                product_id,
                revenue,
                page_uuid
              );
            }
          });
        });
      } else {
        currentPage.filter((item) => {
          const matchDetails =
            item.page_url !== url ? item && getPageMatchingDetails(item) : null;
          const isPageUrlMatch =
            matchDetails && matchDetails.urlPattern
              ? matchMultipleUrlPatterns(
                  matchDetails.matchType,
                  matchDetails.urlPattern,
                  url
                )
              : true;
          if (
            (item.page_url === url && item.events && item.events[0]) ||
            isPageUrlMatch
          ) {
            return item.events.map((event) => {
              if (event.name == event_name) {
                addImpressions(event, item, event_name);
                return event;
              }
            });
          }
        });
      }
    }

    /* Get Match Type and Url Pattern For A Page */
    function getPageMatchingDetails(item) {
      const matchType = item && item.match_type;
      const urlPattern = item && item.url_pattern;
      return { matchType, urlPattern };
    }

    /* Get Sms Text Number */
    function getSmsTextNumber(position, id) {
      $.ajax({
        type: "GET",
        url: `${baseURL}sms_reminder/detail/?visitor_id=${getVisitorID()}`,
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
          response.message.phone_number
            ? lg(`Number found = ${response.message.phone_number}`)
            : lg(`Number not found`);
          createSms(position, response.message.phone_number || "", id);
        },
        error: function (xhr, status, error) {
          createSms(position, "", id);
          lg(`get sms text number failed = ${error}`);
        },
      });
    }

    /* send Text reminder for sms campaign and show thank you message */
    function sendTextReminder(button_text, campaignId) {
      const errMessage = document.getElementById("proofflyNoError");
      const sendButton = document.getElementById("sendText");
      sendButton.innerText = "Loading...";
      const sms = sms_campaigns && JSON.parse(sms_campaigns);
      const draggableWidth = $(`#draggable-${campaignId}`).width();
      const draggableHeight = $(`#draggable-${campaignId}`).height();
      const { advanced, position, thank_you_message, element_path } = sms[0];
      const draggablePosition = (sms && position) || {};
      const BoxValues = getAdvanceStyle(advanced, "Box", "SMS");
      const messageBox = document.createElement("div");
      messageBox.setAttribute("id", "thank_you_message");
      messageBox.innerText = thank_you_message;
      addStyle(messageBox, { position: "absolute", padding: "10px" });
      addStyle(messageBox, BoxValues);
      const parentContainer = $("#parentContainerProoffly")[0];
      const mobileNo = $("#proofflyPhoneNo").intlTelInput("getNumber");
      if (sms && sms[0] && mobileNo && errMessage.innerText === "✓ Valid") {
        $.ajax({
          type: "POST",
          url: `${baseURL}sms_reminder/create/`,
          contentType: "application/json",
          dataType: "json",
          data: JSON.stringify({
            sms_campaign: JSON.stringify(sms[0].id),
            phone_number: mobileNo,
            visitor_id: getVisitorID(),
          }),
          success: function (response) {
            lg(`Text reminder send successfully`);
            parentContainer.removeChild($(`#draggable-${campaignId}`)[0]);
            parentContainer.appendChild(messageBox);
          },
          error: function (xhr, status, error) {
            sendButton.innerText = button_text;
            errMessage.innerText = "Something went wrong, please try again";
            lg(error);
          },
        });
      } else if (!mobileNo && errMessage.innerText === "") {
        errMessage.innerText = "Required";
      }
    }

    /* extract css from object into string for sms campaign */
    function extractAdvanceCss(item, key) {
      const startIndex1 = item.indexOf("{");
      const endIndex1 = item.indexOf("}");
      const startIndex2 = item.lastIndexOf("{");
      const endIndex2 = item.lastIndexOf("}");
      let style1 = "";
      let style2 = "";
      if (startIndex1 > 0 && endIndex1 > 0 && key === "Box") {
        style1 = item.slice(startIndex1 + 1, endIndex1 - 1);
        return style1;
      }
      if (
        startIndex2 > startIndex1 &&
        endIndex2 > endIndex1 &&
        key === "Button"
      ) {
        style2 = item.slice(startIndex2 + 1, endIndex2 - 1);
        return style2;
      }
    }

    /* extract css from object into string for message campaign */
    function extractMessageCampaignAdvanceCss(item, key) {
      const headlineStart = item.indexOf("HeadlineStyle {");
      const headlineEnd =
        item.indexOf("}econdaryLineStyle") > -1
          ? item.indexOf("}econdaryLineStyle")
          : item.indexOf("}SecondaryLineStyle");
      const secondaryStart = item.indexOf("SecondaryLineStyle {");
      const secondaryEnd =
        item.indexOf("}mgStyle") > -1
          ? item.indexOf("}mgStyle")
          : item.indexOf("}oxStyle") > -1
          ? item.indexOf("}oxStyle")
          : item.indexOf("}ImgStyle") > -1
          ? item.indexOf("}ImgStyle")
          : item.indexOf("}BoxStyle");
      const imgStart = item.indexOf("ImgStyle {");
      const imgEnd =
        item.indexOf("}oxStyle") > -1
          ? item.indexOf("}oxStyle")
          : item.indexOf("}BoxStyle");
      const boxStart = item.indexOf("BoxStyle {");
      const boxEnd =
        item.indexOf("}\nPositionStyle") > -1
          ? item.indexOf("}\nPositionStyle")
          : item.lastIndexOf("}");
      const positionStart = item.indexOf("PositionStyle{");
      const positionEnd = item.lastIndexOf("}");

      let style = "";
      switch (key) {
        case "headline":
          style = item.slice(headlineStart + 15, headlineEnd - 1);
          return style;
        case "secondaryLine":
          style = item.slice(secondaryStart + 20, secondaryEnd - 1);
          return style;
        case "box":
          style = item.slice(boxStart + 10, boxEnd - 1);
          return style;
        case "img":
          style = item.slice(imgStart + 10, imgEnd - 1);
          return style;
        case "position":
          style = item.slice(positionStart + 14, positionEnd - 1);
          return style;
        default:
          return item;
      }
    }

    /* split css from string into key value pairs */
    function getAdvanceStyle(advanced, key, setupName) {
      const extracted =
        setupName === "SMS"
          ? extractAdvanceCss(advanced, key)
          : extractMessageCampaignAdvanceCss(advanced, key);
      const result = {};
      const pairs = extracted && extracted.split(";");
      pairs &&
        pairs.map((item) => {
          if (item) {
            const [k, v] = item.split(":");
            result[k.replace(/\s/g, "")] = v;
          }
        });
      return result;
    }
    /* camelize string (remove underscore and uppercase first letter)*/
    function camelize(dasherizedStr) {
      return dasherizedStr.replace(/_([a-zA-Z])/g, function (m1, m2) {
        return m2.toUpperCase();
      });
    }
    /* add css on element */
    function addStyle(element, style) {
      style &&
        Object.keys(style).map((item) => {
          if (item === "font_family" && style[item] === "page_default_font") {
            element.style[camelize(item)] = "inherit";
          } else {
            element.style[camelize(item)] = style[item];
          }
        });
    }
    /* hide campaigns */
    function hideCampaign(animationElem, animation, messageBox, parentElement) {
      const { exit_animation, hide_animation } = animation;
      const time =
        (hide_animation !== "0" || hide_animation !== 0) &&
        parseInt(hide_animation);
      const animationTime =
        animation.display_message !== "0" &&
        parseInt(animation.display_message) * 1000;
      const draggableHeight = $("#draggable").height();
      $("#draggable").css({ "min-height": draggableHeight });
      $("#draggable").css({ "max-height": draggableHeight + 20 });
      if (hide_animation !== "never" && hide_animation !== undefined) {
        setTimeout(
          () => {
            animation &&
              exit_animation === "fade" &&
              $(animationElem).fadeOut("slow");
            $(animationElem).animate(
              {
                opacity: animation.opacity || 1,
                right: exit_animation === "right" ? "-110vw" : "auto",
                left: exit_animation === "left" ? "-110vw" : "auto",
                top: exit_animation === "up" ? "-110vh" : "auto",
                bottom: exit_animation === "down" ? "-110vh" : "auto",
              },
              animationTime,
              "linear",
              function () {
                if (parentElement) {
                  parentElement[0].removeChild(messageBox);
                } else {
                  document.body.removeChild(messageBox);
                }
              }
            );
          },
          time ? time * 1000 : 3000
        );
      }
    }
    /* animate campaigns */
    function animateCampaign(
      parentContainer,
      animation,
      initialize,
      defaultPosition,
      campaignId,
      messageBox,
      parentElement
    ) {
      const animationTime =
        animation.display_message !== "0" &&
        parseInt(animation.display_message) * 1000;
      const draggableWidth = $(`#draggable-${campaignId}`).width();
      const draggableHeight = $("#draggable").height();
      if (initialize) {
        parentContainer.style.top = animation.controls === "down" && "-110vh";
        parentContainer.style.bottom = animation.controls === "up" && "-110vh";
        parentContainer.style.left = animation.controls === "right" && "-110vw";
        parentContainer.style.right = animation.controls === "left" && "-110vw";
      } else {
        animation &&
          animation.controls === "fade" &&
          $(parentContainer).fadeIn("slow");
        animation &&
          $(parentContainer).animate(
            {
              opacity: 1,
              right:
                animation.controls === "left"
                  ? defaultPosition
                    ? "0"
                    : draggableWidth
                  : "auto",
              left: animation.controls === "right" ? "0" : "auto",
              top: animation.controls === "down" ? "0" : "auto",
              bottom: animation.controls === "up" ? "0" : "auto",
            },
            animationTime || 500,
            "linear",
            () =>
              hideCampaign(
                parentContainer,
                animation,
                messageBox,
                parentElement
              )
          );
      }
    }
    /*  create element to append */
    function createMessage(icon, message_content, styles, path, position) {
      const { headline, secondaryLine } = message_content;
      const draggablePosition = position || {};
      const width = document.body.scrollWidth;
      const height = document.body.scrollHeight;
      const isNew = styles.advanced.indexOf("HeadlineStyle {") > -1;
      let headlineStyle = {};
      let secondaryLineStyle = {};
      let boxStyle = {};
      if (isNew) {
        headlineStyle = getAdvanceStyle(styles.advanced, "headline");
        secondaryLineStyle = getAdvanceStyle(styles.advanced, "secondaryLine");
        boxStyle = getAdvanceStyle(styles.advanced, "box");
        imgStyle = getAdvanceStyle(styles.advanced, "img");
        positionStyle = getAdvanceStyle(styles.advanced, "position");
      } else {
        boxStyle = getAdvanceStyle(styles.advanced);
      }
      let messageBox = document.createElement("div");
      let parentContainer = document.createElement("div");
      let imgElement = document.createElement("img");
      let crossIconElement = document.createElement("img");
      crossIconElement.setAttribute(
        "src",
        "https://s3-eu-west-1.amazonaws.com/beta.prooffly.com/img/crossIcon.png"
      );
      let messageContentContainer = document.createElement("div");
      let headlineElement = document.createElement("div");
      let secondaryLineElement = document.createElement("div");
      imgElement.setAttribute("src", icon);
      messageBox.setAttribute("id", `draggable-${styles.id}`);
      addStyle(crossIconElement, {
        position: "absolute",
        top: "-7px",
        left: "auto",
        right: "-8px",
      });
      addStyle(imgElement, {
        width: "25px",
        height: "25px",
        marginRight: "10px",
      });
      addStyle(parentContainer, {
        position: "absolute",
        zIndex: "200",
        width: "100%%",
      });
      // remove message box from DOM.
      crossIconElement.onclick = () => parentContainer.removeChild(messageBox);
      headlineElement.innerText = headline;
      secondaryLineElement.innerText = secondaryLine;
      animateCampaign(messageBox, styles, true);
      if (isNew) {
        addStyle(headlineElement, headlineStyle);
        addStyle(secondaryLineElement, secondaryLineStyle);
        addStyle(messageBox, boxStyle);
        imgStyle && addStyle(imgElement, imgStyle);
      } else {
        boxStyle && addStyle(messageBox, boxStyle);
        boxStyle &&
          addStyle(parentContainer, {
            minHeight: boxStyle.height,
          });
      }
      // add styling and set opacity as 0 to message box
      addStyle(messageBox, {
        padding: "10px",
        wordBreak: "break-word",
        position: "relative",
        opacity: 0,
        display: "flex",
        alignItems: "center",
      });
      messageBox.appendChild(crossIconElement);
      messageBox.appendChild(imgElement);
      messageContentContainer.appendChild(headlineElement);
      messageContentContainer.appendChild(secondaryLineElement);
      messageBox.appendChild(messageContentContainer);
      parentContainer.appendChild(messageBox);
      let parentElement = "";
      if (styles && styles.campaign_css_selector) {
        positionStyle && addStyle(parentContainer, positionStyle);
        let selector = document.querySelector(styles.campaign_css_selector);
        parentElement = document.querySelectorAll(styles.campaign_css_selector);
        selector.append(parentContainer);
        msgDisplayedImpression(styles);
      } else if (draggablePosition && draggablePosition.x) {
        addStyle(parentContainer, {
          left: draggablePosition.x * width + "px",
          top: draggablePosition.y * height + "px",
        });
        document.body.append(parentContainer);
        msgDisplayedImpression(styles);
      } else {
        parentElement = document.querySelectorAll(path);
        parentElement && parentElement[0].appendChild(parentContainer);
        parentElement && parentElement[0] && msgDisplayedImpression(styles);
      }
      animateCampaign(
        messageBox,
        styles,
        false,
        false,
        styles.id,
        parentContainer,
        parentElement
      );
    }

    /* Validate phone number and initialize plugin for it */
    function validatePhoneNo(phone_number) {
      const input = $("#proofflyPhoneNo");
      const button = document.querySelector("#sendText");
      const validationSpan = document.querySelector("#proofflyNoError");
      let iti = $("#proofflyPhoneNo").intlTelInput({
        initialCountry: "GB",
      });
      input.intlTelInput("setNumber", phone_number);
      // here, the index maps to the error code returned from getValidationError - see readme
      const errorMap = [
        "Invalid number",
        "Invalid country code",
        "Too short",
        "Too long",
        "Invalid number",
      ];
      const reset = function () {
        validationSpan.innerHTML = "";
      };
      $("#proofflyPhoneNo").blur(function () {
        reset();
        if ($.trim(input.val())) {
          if (input.intlTelInput("isValidNumber")) {
            input.removeClass("error");
            button.removeAttribute("disabled");
            validationSpan.innerHTML = "✓ Valid";
          } else {
            input.addClass("error");
            const errorCode = input.intlTelInput("getValidationError");
            validationSpan.innerHTML = errorMap[errorCode];
            button.setAttribute("disabled", true);
            validationSpan.classList.remove("hide");
          }
        }
      });
      $("#proofflyPhoneNo").click(function () {
        if ($.trim(input.val())) {
          button.removeAttribute("disabled");
        }
      });
    }
    /* create sms to append  */
    function createSms(position, phone_number, campaignId) {
      const sms = sms_campaigns && JSON.parse(sms_campaigns);
      const {
        advanced,
        stock_message,
        selected_icon,
        height,
        display_message,
        controls,
        button_text,
        element_path,
        hide_animation,
      } = sms[0];
      const animation = { display_message, controls, hide_animation };
      const draggablePosition = position || {};
      const absoluteWidth = document.body.scrollWidth;
      const absoluteHeight = document.body.scrollHeight;
      const BoxValues = getAdvanceStyle(advanced, "Box", "SMS");
      const ButtonValues = getAdvanceStyle(advanced, "Button", "SMS");
      let parentContainer = document.createElement("div");
      let smsBox = document.createElement("div");
      let messageContainer = document.createElement("div");
      let imgElement = document.createElement("img");
      let messageBox = document.createElement("div");
      let inputContainer = document.createElement("div");
      let formContainer = document.createElement("div");
      let input = document.createElement("input");
      let button = document.createElement("button");
      let validationSpan = document.createElement("div");
      validationSpan.setAttribute("id", "proofflyNoError");
      validationSpan.setAttribute("class", "hide");
      button.setAttribute("id", "sendText");
      imgElement.setAttribute("src", selected_icon);
      smsBox.setAttribute("id", `draggable-${campaignId}`);
      input.setAttribute("type", "tel");
      input.setAttribute("id", "proofflyPhoneNo");
      parentContainer.setAttribute("id", "parentContainerProoffly");
      addStyle(imgElement, {
        width: "25px",
        height: "25px",
        marginRight: "10px",
      });
      addStyle(parentContainer, {
        position: "absolute",
        zIndex: "200",
        width: "100%%",
      });
      addStyle(validationSpan, { display: "block" });
      messageBox.innerText = stock_message;
      button.innerText = button_text;
      messageContainer.appendChild(imgElement);
      messageContainer.appendChild(messageBox);
      addStyle(button, ButtonValues);
      addStyle(smsBox, BoxValues);
      addStyle(smsBox, { opacity: 0, position: "absolute" });
      addStyle(messageContainer, {
        padding: "10px",
        wordBreak: "break-word",
        display: "flex",
        alignItems: "center",
      });
      addStyle(input, { marginRight: "15px", width: "100%%" });
      addStyle(button, { marginLeft: "15px" });
      addStyle(inputContainer, {
        marginRight: "30px",
        marginLeft: "42px",
        marginBottom: "20px",
      });
      addStyle(formContainer, { display: "flex" });
      addStyle(validationSpan, { color: "red" });
      addStyle(parentContainer, { minHeight: height });
      animateCampaign(smsBox, animation, true);
      formContainer.appendChild(input);
      formContainer.appendChild(button);
      inputContainer.appendChild(formContainer);
      inputContainer.appendChild(validationSpan);
      smsBox.appendChild(messageContainer);
      smsBox.appendChild(inputContainer);
      parentContainer.appendChild(smsBox);
      let parentElement = "";
      if (draggablePosition && draggablePosition.x) {
        addStyle(parentContainer, {
          left: draggablePosition.x * absoluteWidth + "px",
          top: draggablePosition.y * absoluteHeight + "px",
        });
        document.body.append(parentContainer);
      } else {
        parentElement = document.querySelectorAll(element_path);
        parentElement && parentElement[0].appendChild(parentContainer);
      }
      validatePhoneNo(phone_number);
      animateCampaign(
        smsBox,
        animation,
        false,
        false,
        campaignId,
        parentContainer,
        parentElement
      );
      $("#sendText").click(function () {
        sendTextReminder(button_text, campaignId);
      });
    }

    /* returns if time is valid */
    function isTimeValid(time, position) {
      if (position === "start") {
        return new Date(time) < new Date();
      } else {
        return new Date(time) > new Date();
      }
    }

    function isArray(ele) {
      return Array.isArray(ele);
    }

    /* create message with actual keyword values */
    function replaceMessageValues(
      message,
      indices,
      value1,
      value2,
      countFirst,
      value3
    ) {
      const {
        startExist,
        endExist,
        startIndex1,
        endIndex1,
        startIndex2,
        endIndex2,
      } = indices;

      const { headline, secondaryLine } = message;
      let localmessage = { headline: "", secondaryLine: "" };
      let key2 = "";
      let key1 = "";
      let line1 = headline;
      let line2 = secondaryLine;
      let keywordValues = Object.values(value1);
      let key3 = value3.map((item) => {
        return value1[item.replaceAll(".", "_")];
      });

      // extract key1 from message content
      if (startExist === "headline" && countFirst) {
        key1 = getAllKeywordsName(headline, startIndex1, endIndex1);
        keywordValues &&
          keywordValues.length > 0 &&
          keywordValues.map((keyword) => {
            let newStartIndex1 = line1.indexOf("Prooffly");
            let newEndIndex1 = line1.indexOf("]]");
            key1 = line1.slice(newStartIndex1 - 2, newEndIndex1 + 2);
            line1 = key1 !== "" ? line1.replace(key1, keyword) : line1;
          });
      } else if (startExist === "secondaryLine" && countFirst) {
        key1 = getAllKeywordsName(secondaryLine, startIndex1, endIndex1);
        keywordValues &&
          keywordValues.length > 0 &&
          keywordValues.map((keyword) => {
            let newStartIndex1 = line2.indexOf("Prooffly");
            let newEndIndex1 = line2.indexOf("]]");
            key1 = line2.slice(newStartIndex1 - 2, newEndIndex1 + 2);
            line2 = key1 !== "" ? line2.replace(key1, keyword) : line2;
          });
      } else if (startExist === "headline" && !countFirst) {
        key2 = getAllKeywordsName(headline, startIndex1, endIndex1);
        keywordValues &&
          keywordValues.length > 0 &&
          keywordValues.map((keyword) => {
            let newStartIndex1 = line1.indexOf("Prooffly");
            let newEndIndex1 = line1.indexOf("]]");
            key2 = line1.slice(newStartIndex1 - 2, newEndIndex1 + 2);
            line1 = key2 !== "" ? line1.replace(key2, keyword) : line1;
          });
      } else if (startExist === "secondaryLine" && !countFirst) {
        key2 = getAllKeywordsName(secondaryLine, startIndex1, endIndex1);
        keywordValues &&
          keywordValues.length > 0 &&
          keywordValues.map((keyword) => {
            let newStartIndex1 = line2.indexOf("Prooffly");
            let newEndIndex1 = line2.indexOf("]]");
            key2 = line2.slice(newStartIndex1 - 2, newEndIndex1 + 2);
            line2 = key2 !== "" ? line2.replace(key2, keyword) : line2;
          });
      }
      // extract key2 from message content
      if (endExist === "headline" && countFirst) {
        if (isArray(startIndex2) && isArray(endIndex2)) {
          key2 = getAllKeywordsName(headline, startIndex2, endIndex2);
          keywordValues &&
            keywordValues.length > 0 &&
            keywordValues.map((keyword) => {
              let newStartIndex1 = line1.indexOf("Prooffly");
              let newEndIndex1 = line1.indexOf("]]");
              key2 = line1.slice(newStartIndex1 - 2, newEndIndex1 + 2);
              line1 = key2 !== "" ? line1.replace(key2, keyword) : line1;
            });
        } else {
          key2 = headline.slice(startIndex2 - 2, endIndex2 + 2);
          line1 = key2 !== "" ? line1.replace(key2, value2) : line1;
        }
      } else if (endExist === "secondaryLine" && countFirst) {
        if (isArray(startIndex2) && isArray(endIndex2)) {
          key2 = getAllKeywordsName(secondaryLine, startIndex2, endIndex2);
          key3 &&
            key3.length > 0 &&
            key3.map((keyword) => {
              let newStartIndex1 = line2.indexOf("Prooffly");
              let newEndIndex1 = line2.indexOf("]]");
              key2 = line2.slice(newStartIndex1 - 2, newEndIndex1 + 2);
              line2 = key2 !== "" ? line2.replace(key2, keyword) : line2;
            });
        } else {
          key2 = secondaryLine.slice(startIndex2 - 2, endIndex2 + 2);
          line2 = key2 !== "" ? line2.replace(key2, value2) : line2;
        }
      }
      if (endExist === "headline" && !countFirst) {
        if (isArray(startIndex2) && isArray(endIndex2)) {
          key1 = getAllKeywordsName(headline, startIndex2, endIndex2);
          keywordValues &&
            keywordValues.length > 0 &&
            keywordValues.map((keyword) => {
              let newStartIndex1 = line1.indexOf("Prooffly");
              let newEndIndex1 = line1.indexOf("]]");
              key1 = line1.slice(newStartIndex1 - 2, newEndIndex1 + 2);
              line1 = key1 !== "" ? line1.replace(key1, keyword) : line1;
            });
        } else {
          key1 = headline.slice(startIndex2 - 2, endIndex2 + 2);
          line1 = key1 !== "" ? line1.replace(key1, value1) : line1;
        }
      } else if (endExist === "secondaryLine" && !countFirst) {
        if (isArray(startIndex2) && isArray(endIndex2)) {
          key1 = getAllKeywordsName(secondaryLine, startIndex2, endIndex2);
          keywordValues &&
            keywordValues.length > 0 &&
            keywordValues.map((keyword) => {
              let newStartIndex1 = line2.indexOf("Prooffly");
              let newEndIndex1 = line2.indexOf("]]");
              key1 = line2.slice(newStartIndex1 - 2, newEndIndex1 + 2);
              line2 = key1 !== "" ? line2.replace(key1, keyword) : line2;
            });
        } else {
          key1 = secondaryLine.slice(startIndex2 - 2, endIndex2 + 2);
          line2 = key1 !== "" ? line2.replace(key1, value1) : line2;
        }
      } else {
        key2 = "";
      }

      // replace key with values
      localMessage = {
        headline: line1,
        secondaryLine: line2,
      };
      return localMessage;
    }
    function callMessageKeywordApi(
      key1,
      key2,
      timePeriod,
      message,
      indices,
      item,
      path,
      countFirst,
      key3
    ) {
      const messagePage = pages && JSON.parse(pages);
      const product_id = getSkuId();
      const page_uuid = getPageUuid();

      // replace string for multiple keyword support
      let keys1 = key1.toString();
      keys1 = keys1.replaceAll(",", "|");

      if (product_id) {
        $.ajax({
          type: "GET",
          url: `${baseURL}get_count/?page_uuid=${page_uuid}&count_parameter=${keys1.replaceAll(
            ".",
            "_"
          )}&count_time=${key2}&time_period=${timePeriod}&visitor_id=${getVisitorID()}&product_id=${product_id}`,
          contentType: "application/json",
          dataType: "json",
          success: function (response) {
            lg(`${keys1.replace(".", "_")} = ${response.message.count}`);

            //check is all keyowrds count is greater than display count
            let showMessage = true;

            let responseCount = response.message.count;

            Object.values(responseCount).map((responseItem) => {
              if (parseInt(responseItem) < parseInt(item.display_count)) {
                showMessage = false;
              }
            });
            if (showMessage) {
              const localMessage = replaceMessageValues(
                message,
                indices,
                response.message.count,
                response.message.count_time,
                countFirst,
                key3
              );
              createMessage(
                item.selected_icon,
                localMessage,
                item,
                item.element_path || path,
                item.position
              );
            }
          },
          error: function (xhr, status, error) {
            lg(error);
          },
        });
      }
    }

    function getIndexOf(item, first, last) {
      let start = -1,
        end = -1;
      if (first) {
        start = item.indexOf("Prooffly");
        end = item.indexOf("]]");
        return { start, end };
      }
      if (last) {
        start = item.lastIndexOf("Prooffly");
        end = item.lastIndexOf("]]");
        return { start, end };
      }
    }

    //  get index of multiple prooffly keyword
    function getIndexOfMultipleOccurence(searchTerm, str) {
      const searchStrLen = searchTerm.length;
      if (searchStrLen == 0) {
        return [];
      }
      var startIndex = 0,
        index,
        indices = [];
      while ((index = str.indexOf(searchTerm, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
      }
      return indices;
    }

    // get all keywords name in array
    function getAllKeywordsName(str, start, end) {
      let keywordName = [];
      start &&
        start.map((item, index) => {
          let startIndex = item;
          let endIndex = end[index];
          keywordName.push(str.substring(startIndex + 9, endIndex));
        });
      return keywordName;
    }
    /* get message keywords value */
    function getMessageKeywordsValue(icon, message, item, path, pageId) {
      const { headline, secondaryLine, itemData } = message;
      let startIndex1 = [];
      let endIndex1 = [];
      let startIndex2 = -1;
      let endIndex2 = -1;
      let startExist = "";
      let endExist = "";
      let isTimeCampaign = false;
      let isCountCampaign = false;

      // Finding event count keyword in both lines
      if (headline !== null) {
        const start = getIndexOfMultipleOccurence("Prooffly", headline);
        const end = getIndexOfMultipleOccurence("]]", headline);
        startIndex1 = start;
        endIndex1 = end;
        startExist = start.length > 0 && end.length > 0 ? "headline" : "";
      }
      if (secondaryLine !== null && startIndex1.length == 0) {
        const start = getIndexOfMultipleOccurence("Prooffly", secondaryLine);
        const end = getIndexOfMultipleOccurence("]]", secondaryLine);
        startIndex1 = start;
        endIndex1 = end;
        startExist = start.length > 0 && end.length > 0 ? "secondaryLine" : "";
      }

      // Finding time keyword in both lines
      if (startExist === "headline") {
        const { start, end } = getIndexOf(headline, false, true);

        startIndex2 = start;
        endIndex2 = end;
        endExist = start > -1 && end > -1 ? "headline" : "";
      }
      if (startExist === "secondaryLine") {
        const { start, end } = getIndexOf(secondaryLine, false, true);
        startIndex2 = start;
        endIndex2 = end;
        endExist = start > -1 && end > -1 ? "secondaryLine" : "";
      }

      if (startExist === "headline" && secondaryLine !== null) {
        const start = getIndexOfMultipleOccurence("Prooffly", secondaryLine);
        const end = getIndexOfMultipleOccurence("]]", secondaryLine);
        startIndex2 = start;
        endIndex2 = end;
        endExist = start.length > 0 && end.length > 0 ? "secondaryLine" : "";
      }

      let countFirst = true;
      if (startExist === "headline" && endExist === "headline") {
        const countIndex = headline.indexOf("count");
        const timeIndex = headline.indexOf("time");

        if (
          countIndex &&
          timeIndex &&
          countIndex > timeIndex &&
          countIndex !== -1 &&
          timeIndex !== -1
        ) {
          countFirst = false;
        } else if (
          timeIndex &&
          countIndex &&
          timeIndex > countIndex &&
          countIndex !== -1 &&
          timeIndex !== -1
        ) {
          countFirst = true;
        }
      } else if (startExist === "headline" && endExist === "secondaryLine") {
        const ifCount = headline.includes("count");
        if (ifCount) {
          countFirst = true;
        } else {
          countFirst = false;
        }
      } else if (
        startExist === "secondaryLine" &&
        endExist === "secondaryLine"
      ) {
        const countIndex = secondaryLine.indexOf("count");
        const timeIndex = secondaryLine.indexOf("time");
        if (
          countIndex &&
          timeIndex &&
          countIndex > timeIndex &&
          countIndex !== -1 &&
          timeIndex !== -1
        ) {
          countFirst = false;
        } else if (
          timeIndex &&
          countIndex &&
          timeIndex > countIndex &&
          countIndex !== -1 &&
          timeIndex !== -1
        ) {
          countFirst = true;
        }
      }

      let key1 = "";
      let key2 = "1";
      // Used to check if startExist headline then find keyword from secondary and vice versa

      let key3 = [];
      let timePeriod = "hours";

      if (startIndex1.length > 0 && endIndex1.length > 0 && countFirst) {
        key1 =
          startExist === "headline"
            ? getAllKeywordsName(headline, startIndex1, endIndex1)
            : getAllKeywordsName(secondaryLine, startIndex1, endIndex1);
      } else if (
        startIndex1.length > 0 &&
        endIndex1.length > 0 &&
        !countFirst
      ) {
        const local =
          startExist === "headline"
            ? getAllKeywordsName(headline, startIndex1, endIndex1)
            : getAllKeywordsName(secondaryLine, startIndex1, endIndex1);

        const timeInHours =
          local &&
          local.length > 0 &&
          local.filter((item) => item == "time_in_hours");
        const timeInDays =
          local &&
          local.length > 0 &&
          local.filter((item) => item == "time_in_days");

        if (timeInHours.length > 0) {
          const { start, end } = getIndexOf(timeInHours[0], true);
          const timeKeyword = timeInHours[0].slice(start + 9, end);
          key2 = timeKeyword.slice(14);

          timePeriod = "hours";
        } else if (timeInDays.length > 0) {
          const { start, end } = getIndexOf(timeInDays[0], true);
          const timeKeyword = timeInDays[0].slice(start + 9, end);
          key2 = timeKeyword.slice(13);
          timePeriod = "days";
        } else {
          key2 = "1";
          timePeriod = "hours";
        }
      }

      if (startIndex2.length > 0 && endIndex2.length > 0 && countFirst) {
        const local =
          endExist === "headline"
            ? getAllKeywordsName(headline, startIndex2, endIndex2)
            : getAllKeywordsName(secondaryLine, startIndex2, endIndex2);
        const timeInHours =
          local &&
          local.length > 0 &&
          local.filter((item) => item == "time_in_hours");
        const timeInDays =
          local &&
          local.length > 0 &&
          local.filter((item) => item == "time_in_days");

        if (timeInHours.length > 0) {
          const { start, end } = getIndexOf(timeInHours[0], true);
          const timeKeyword = timeInHours[0].slice(start + 9, end);
          key2 = timeKeyword.slice(14);
          timePeriod = "hours";
        } else if (timeInDays.length > 0) {
          const { start, end } = getIndexOf(timeInDays[0], true);
          const timeKeyword = timeInDays[0].slice(start + 9, end);
          key2 = timeKeyword.slice(13);
          timePeriod = "days";
        } else {
          key2 = "1";
          timePeriod = "hours";
        }
      } else if (startIndex2 > 0 && endIndex2 > 0 && !countFirst) {
        key1 =
          endExist === "headline"
            ? getAllKeywordsName(headline, startIndex2, endIndex2)
            : getAllKeywordsName(secondaryLine, startIndex2, endIndex2);
      }

      // check is there any keyword on secondary line other than time keyword
      if (startExist === "headline") {
        const start = getIndexOfMultipleOccurence("Prooffly", secondaryLine);
        const end = getIndexOfMultipleOccurence("]]", secondaryLine);
        const secondaryKeywords = getAllKeywordsName(secondaryLine, start, end);
        if (isArray(key1)) {
          secondaryKeywords &&
            secondaryKeywords.length > 0 &&
            secondaryKeywords.map((item) => {
              key3.push(item);
              return key1.push(item);
            });
        }
      } else {
        //  will check is there any keyword in headline other than
        const start = getIndexOfMultipleOccurence("Prooffly", headline);
        const end = getIndexOfMultipleOccurence("]]", headline);
        const headlineKeywords = getAllKeywordsName(headline, start, end);
        if (isArray(key1)) {
          headlineKeywords &&
            headlineKeywords.length > 0 &&
            headlineKeywords.map((item) => {
              key3.push(item);
              return key1.push(item);
            });
        }
      }

      if (key1.length === 0 && key2 === "1") {
        const { headline, secondaryLine } = message;
        localMessage = {
          headline,
          secondaryLine,
        };
        createMessage(
          item.selected_icon,
          localMessage,
          item,
          item.element_path || path,
          item.position
        );
      }

      key1.length == 0 ||
        (!key2 &&
          lg(
            "Error in getting prooffly keywords key1 (count)= ",
            key1,
            "key2 (time) =",
            key2,
            "timePeriod (days/hours) = ",
            timePeriod
          ));

      // condition useronboard
      if (itemData.is_onboarding) {
        if (
          itemData.campaign_time &&
          itemData.campaign_time_period !== "forever"
        ) {
          key2 = itemData.campaign_time;
          timePeriod = itemData.campaign_time_period;
        }
      }
      key1.length > 0 &&
        key2 &&
        callMessageKeywordApi(
          key1,
          key2,
          timePeriod,
          message,
          {
            startIndex1,
            endIndex1,
            startIndex2,
            endIndex2,
            startExist,
            endExist,
          },
          icon,
          item,
          path,
          pageId,
          countFirst,
          key3
        );

      // keys, time
    }

    /* render campaigns  */
    function renderCampaigns(item, url, type, path) {
      const isUrlPatternMatch =
        item.page.page_url !== url ? matchMessageUrlPattern(item.page) : true;
      if (type === "messageCampaign") {
        if (item.page.page_url === url || isUrlPatternMatch) {
          lg(`Messages for ${url} found`);
          if (
            item.campaign_start_time &&
            isTimeValid(item.campaign_start_time, "start")
          ) {
            const isValid = item.campaign_end_time
              ? isTimeValid(item.campaign_end_time, "end")
              : true;
            isValid &&
              getMessageKeywordsValue(
                item.selected_icon,
                {
                  headline: item.message_content,
                  secondaryLine: item.secondary_message_content,
                  itemData: item,
                },
                item,
                item.element_path || path,
                item.page.id
              );
          } else if (!item.campaign_start_time) {
            const isValid = item.campaign_end_time
              ? isTimeValid(item.campaign_end_time, "end")
              : true;
            isValid &&
              getMessageKeywordsValue(
                item.selected_icon,
                {
                  headline: item.message_content,
                  secondaryLine: item.secondary_message_content,
                  itemData: item,
                },
                item,
                item.element_path || path,
                item.page.id
              );
          }
        }
      } else if (type === "smsCampaign") {
        if (item.page.page_url === url) {
          const stock_variable = findJsVariable(item.event);
          lg(`Sms campaign for ${url} found`);
          if (
            item.campaign_start_time &&
            isTimeValid(item.campaign_start_time, "start")
          ) {
            const isValid = item.campaign_end_time
              ? isTimeValid(item.campaign_end_time, "end")
              : true;
            isValid &&
              stock_variable &&
              getSmsTextNumber(item.position, item.id);
          } else if (!item.campaign_start_time) {
            const isValid = item.campaign_end_time
              ? isTimeValid(item.campaign_end_time, "end")
              : true;
            isValid &&
              stock_variable &&
              getSmsTextNumber(item.position, item.id);
          }
        }
      }
    }

    // check page condition
    function matchMessageUrlPattern(msgPage) {
      const localPages =
        pages &&
        JSON.parse(pages).filter((item) => {
          if (item.page_url === msgPage.page_url) {
            return true;
          }
        });

      const pageValues = localPages && localPages[0];
      const matchType = pageValues && pageValues.match_type;
      const urlPattern = pageValues && pageValues.url_pattern;
      let result = false;
      const url = getAbsoluteURL();
      result = matchMultipleUrlPatterns(matchType, urlPattern, url);
      return result;
    }

    /* Display / show message */
    function showMessage(activationId) {
      const localMessages = messages && JSON.parse(messages);
      const url = getAbsoluteURL();
      const selectors =
        JSON.parse(productInfo) &&
        JSON.parse(productInfo).filter((item) => {
          if (item.product_name) {
            return item;
          }
        });
      const path = selectors[0] && selectors[0]["product_name"];
      if (activationId) {
        localMessages &&
          localMessages.filter((item) => {
            if (item.uuid_key === activationId) {
              renderCampaigns(item, url, "messageCampaign", path);
            }
          });
      } else {
        localMessages &&
          localMessages.map((item) => {
            if (item.is_manual === false) {
              renderCampaigns(item, url, "messageCampaign", path);
            }
          });
      }
    }

    /* find js variable value */
    function findJsVariable(event) {
      const selectors =
        JSON.parse(productInfo) &&
        JSON.parse(productInfo).filter((item) => {
          if (item[event]) {
            return item;
          }
        });
      if (
        selectors[0] &&
        selectors[0]["js_variable"] === true &&
        selectors[0][event] === "proofflyGlobalJsVariable"
      ) {
        window.proofflyGlobalJsVariable;
        window.proofflyGlobalJsVariable = 1000;
        lg(
          "Global variable not found creating dummy variable [proofflyGlobalJsVariable] to test sms campaign"
        );
      }
      let stock_variable = "";
      try {
        stock_variable =
          selectors[0] &&
          selectors[0]["js_variable"] === true &&
          eval(selectors[0][event]);
      } catch {
        lg("Js Variable value not defined");
      }
      if (typeof stock_variable === "number" && stock_variable !== 0) {
        lg(`stock available = ${stock_variable}`);
        return stock_variable;
      } else {
        lg(
          `${
            selectors[0][event]
          } global variable return ${typeof stock_variable} for stock available`
        );
        return true;
      }
    }

    /* show sms reminder */
    function showSmsReminder(activationId) {
      const localSms = sms_campaigns && JSON.parse(sms_campaigns);
      const url = getAbsoluteURL();
      if (activationId) {
        localSms &&
          localSms.filter((item) => {
            if (item.uuid_key === activationId) {
              renderCampaigns(item, url, "smsCampaign");
            }
          });
      } else {
        localSms &&
          localSms.map((item) => {
            if (item.is_manual === false) {
              renderCampaigns(item, url, "smsCampaign");
            }
          });
      }
    }
    /* read cookie value */
    function readCookie(name) {
      var nameEQ = name + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(";");
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }

    /**
       Utility function to log with identifier
  */
    function lg(message) {
      const params = window.location.search || "";
      if (params.includes("proofflylog=true")) {
        console.log(" /soclog/ " + message);
      }
    }

    /**
       OrderConfirmation Object
  */
    function OrderConf(orderedProductIDSelector, totalRevenueSelector) {
      this.orderedProducts = {};
      this.orderedRevenue = 0;
      $(orderedProductIDSelector).each(function () {
        OrderConf.orderedProducts.push(this.text());
      });
      this.orderedRevenue = parseFloat($(totalRevenueSelector).text());
    }
    /* track product purchase */
    const trackOrderPurchase = function trackOrder(ids, revenue) {
      const pageEvents = JSON.parse(localStorage.getItem("pageEvents"));
      lg(`Track order called for ids - ${ids}`);
      // distribute revenue for single product
      let finalRevenue = ids && revenue / ids.length;
      ids.map((item) => {
        pageEvents &&
          pageEvents.map((event) => {
            if (event.js_variable === item) {
              calculateClickImpression(
                "",
                true,
                item,
                event.uuid_key,
                finalRevenue,
                event.page_uuid
              );
            }
          });
      });
    };
    const activateCampaign = function trackOrder(id, type) {
      lg(
        `Manually activate campaign triggered for id = ${id}, type of campaign = ${type}`
      );
      if (type === "messageCampaign") {
        showMessage(id);
      } else if (type === "smsCampaign") {
        showSmsReminder(id);
      }
    };
    return {
      trackOrder: trackOrderPurchase,
      activateCampaign,
    };
  }
}
const prooffly = new Prooffly();

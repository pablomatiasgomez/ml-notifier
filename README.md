# ml-notifier

Tiny NodeJS script to get notified when a new product is published in MercadoLibre's site based on some fillters.

You can create a crontab to receive notifications every day, for example:

```
00 11  *  *  1-5 /path/to/script/ml-notifier.js golf-gti-mk4 > /path/golf-gti-mk4-results.txt
```

This will check every week day at 11am for new products and will alert you if new products are found.

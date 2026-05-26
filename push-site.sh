#!/bin/bash
# Envia apenas o conteúdo de marketing/site/code para o repositório de marketing.
# Uso: bash push-site.sh
git subtree push --prefix=marketing/site/code marketing main

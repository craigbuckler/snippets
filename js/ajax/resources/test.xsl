<?xml version="1.0" encoding="windows-1252" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
   <xsl:output method="html" indent="no" />

<xsl:variable name="comment"><![CDATA[<!-- new content -->]]></xsl:variable>

<xsl:template match="/">
	<div>
		<xsl:value-of select="$comment" disable-output-escaping="yes" />
		<xsl:apply-templates />
	</div>
</xsl:template>

<xsl:template match="Title">
	<h1><xsl:value-of select="." /></h1>
</xsl:template>

<xsl:template match="Author">
	<h2><xsl:value-of select="." /></h2>
</xsl:template>

<xsl:template match="para">
	<p class="normal"><xsl:value-of select="." /></p>
</xsl:template>

</xsl:stylesheet>

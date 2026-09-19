package com.sail.charter.domain.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ContractTypeConverter implements AttributeConverter<ContractType, String> {

    @Override
    public String convertToDatabaseColumn(ContractType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name().toLowerCase();
    }

    @Override
    public ContractType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return ContractType.valueOf(dbData.trim().toUpperCase());
    }
}

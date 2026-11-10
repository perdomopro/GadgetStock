package com.perdomazo.firstproject.Services;

import com.perdomazo.firstproject.Models.GadgetModel;
import com.perdomazo.firstproject.Repositories.GadgetRepository;
import com.perdomazo.firstproject.dto.FinancialSummaryDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GadgetService {

    private final GadgetRepository gadgetRepository;

    public GadgetService(GadgetRepository gadgetRepository) {
        this.gadgetRepository = gadgetRepository;
    }

    @Transactional(readOnly = true)
    public List<GadgetModel> getAllGadget() {
        return gadgetRepository.findAll();
    }

    @Transactional(readOnly = true)
    public GadgetModel findById(Long id) {
        return gadgetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Gadget not found with id: " + id));
    }

    @Transactional
    public GadgetModel saveGadget(GadgetModel gadget) {
        validateAndSanitizeSaleState(gadget);
        return gadgetRepository.save(gadget);
    }

    @Transactional
    public GadgetModel update(Long id, GadgetModel incoming) {
        if (incoming == null) {
            throw new IllegalArgumentException("Gadget payload cannot be null");
        }

        if (Boolean.TRUE.equals(incoming.getIsSold())) {
            BigDecimal soldPrice = incoming.getSoldPrice();
            if (soldPrice == null || soldPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Sold price must be greater than 0 when item is marked as sold");
            }
        }

        GadgetModel existing = gadgetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Gadget not found with id: " + id));

        existing.setName(incoming.getName());
        existing.setModel(incoming.getModel());
        existing.setCategory(incoming.getCategory());
        existing.setPrice(incoming.getPrice());
        existing.setRepairCost(incoming.getRepairCost() != null ? incoming.getRepairCost() : BigDecimal.ZERO);
        existing.setListedPrice(incoming.getListedPrice());
        existing.setComments(incoming.getComments());
        existing.setRepair(Boolean.TRUE.equals(incoming.getRepair()));

        if (Boolean.TRUE.equals(incoming.getIsSold())) {
            existing.setIsSold(true);
            existing.setSoldPrice(incoming.getSoldPrice());
            if (incoming.getSoldDate() != null) {
                existing.setSoldDate(incoming.getSoldDate());
            } else if (existing.getSoldDate() == null) {
                existing.setSoldDate(LocalDateTime.now());
            }
        } else {
            existing.setIsSold(false);
            existing.setSoldPrice(null);
            existing.setSoldDate(null);
        }

        return gadgetRepository.save(existing);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!gadgetRepository.existsById(id)) {
            throw new EntityNotFoundException("Gadget not found with id: " + id);
        }
        gadgetRepository.deleteById(id);
    }

    @Transactional
    public void deleteByName(String name) {
        List<GadgetModel> gadgets = gadgetRepository.findByName(name);
        if (!gadgets.isEmpty()) {
            Long gadId = gadgets.getFirst().getId();
            gadgetRepository.deleteById(gadId);
        }
    }

    @Transactional(readOnly = true)
    public List<GadgetModel> findByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return gadgetRepository.findAll();
        }
        return gadgetRepository.findByNameContainingIgnoreCase(name.trim());
    }

    @Transactional(readOnly = true)
    public List<GadgetModel> getAllSoldGadget() {
        return gadgetRepository.findByIsSoldTrue();
    }

    @Transactional(readOnly = true)
    public Float calculateMoneySpent() {
        Float total = gadgetRepository.getTotalSpent();
        return total != null ? total : 0.0f;
    }

    /**
     * Retrieves the financial summary of inventory stock and realized sales.
     * Features 14-17 (M3).
     *
     * @return FinancialSummaryDTO containing stockCapital, netProfit, roi, soldItemsCount, availableItemsCount.
     */
    @Transactional(readOnly = true)
    public FinancialSummaryDTO getFinancialSummary() {
        List<GadgetModel> all = gadgetRepository.findAll();
        return calculateFinancialSummary(all);
    }

    /**
     * Pure calculation of financial summary metrics from a collection of gadgets.
     *
     * @param gadgets the list of gadget models to analyze
     * @return calculated FinancialSummaryDTO
     */
    public FinancialSummaryDTO calculateFinancialSummary(List<GadgetModel> gadgets) {
        if (gadgets == null || gadgets.isEmpty()) {
            return FinancialSummaryDTO.empty();
        }

        BigDecimal stockCapital = BigDecimal.ZERO;
        BigDecimal netProfit = BigDecimal.ZERO;
        BigDecimal totalSoldCostBasis = BigDecimal.ZERO;
        int soldItemsCount = 0;
        int availableItemsCount = 0;

        for (GadgetModel gadget : gadgets) {
            if (gadget == null) {
                continue;
            }

            BigDecimal price = gadget.getPrice() != null ? gadget.getPrice() : BigDecimal.ZERO;
            BigDecimal repairCost = gadget.getRepairCost() != null ? gadget.getRepairCost() : BigDecimal.ZERO;
            BigDecimal totalItemCost = price.add(repairCost);

            if (Boolean.TRUE.equals(gadget.getIsSold())) {
                soldItemsCount++;
                BigDecimal soldPrice = gadget.getSoldPrice() != null ? gadget.getSoldPrice() : BigDecimal.ZERO;
                BigDecimal profit = soldPrice.subtract(totalItemCost);
                netProfit = netProfit.add(profit);
                totalSoldCostBasis = totalSoldCostBasis.add(totalItemCost);
            } else {
                availableItemsCount++;
                stockCapital = stockCapital.add(totalItemCost);
            }
        }

        Double roi;
        if (totalSoldCostBasis.compareTo(BigDecimal.ZERO) <= 0) {
            roi = 0.0;
        } else {
            roi = netProfit.multiply(BigDecimal.valueOf(100))
                    .divide(totalSoldCostBasis, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return new FinancialSummaryDTO(
            stockCapital.setScale(2, RoundingMode.HALF_UP),
            netProfit.setScale(2, RoundingMode.HALF_UP),
            roi,
            soldItemsCount,
            availableItemsCount
        );
    }

    private void validateAndSanitizeSaleState(GadgetModel gadget) {
        if (gadget == null) {
            throw new IllegalArgumentException("Gadget payload cannot be null");
        }
        if (gadget.getRepairCost() == null) {
            gadget.setRepairCost(BigDecimal.ZERO);
        }
        if (gadget.getRepair() == null) {
            gadget.setRepair(false);
        }
        if (gadget.getCategory() == null) {
            gadget.setCategory("");
        }
        if (Boolean.TRUE.equals(gadget.getIsSold())) {
            BigDecimal soldPrice = gadget.getSoldPrice();
            if (soldPrice == null || soldPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Sold price must be greater than 0 when item is marked as sold");
            }
            if (gadget.getSoldDate() == null) {
                gadget.setSoldDate(LocalDateTime.now());
            }
        } else {
            gadget.setIsSold(false);
            gadget.setSoldPrice(null);
            gadget.setSoldDate(null);
        }
    }
}
